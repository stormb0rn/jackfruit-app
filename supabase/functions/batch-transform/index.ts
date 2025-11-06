// Supabase Edge Function to batch transform images for all looking options
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_API_ENDPOINT = "https://fal.run/fal-ai/nano-banana/edit";

interface EditStyle {
  id: string;
  prompt: string;
}

interface BatchTransformRequest {
  identityPhotoUrl: string;
  editStyles: EditStyle[];
  userId?: string;
  identityPhotoId?: string;
}

interface TransformResult {
  editStyleId: string;
  status: "completed" | "failed";
  imageUrl?: string;
  error?: string;
  transformationId?: string;
}

async function transformSingleImage(
  identityPhotoUrl: string,
  editStyle: EditStyle,
  falApiKey: string,
  userId?: string,
  identityPhotoId?: string
): Promise<TransformResult> {
  try {
    const { id: editStyleId, prompt } = editStyle;

    // Create transformation record if userId provided
    let transformationId: string | null = null;

    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: transformation, error: dbError } = await supabase
        .from("transformations")
        .insert({
          user_id: userId,
          identity_photo_id: identityPhotoId,
          edit_style_id: editStyleId,
          prompt: prompt,
          status: "processing",
        })
        .select()
        .single();

      if (!dbError && transformation) {
        transformationId = transformation.id;
      }
    }

    // Call FAL API
    const falResponse = await fetch(FAL_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        image_urls: [identityPhotoUrl],
        num_images: 1,
        output_format: "jpeg",
        aspect_ratio: "1:1",
      }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error(`FAL API error for ${editStyleId}:`, errorText);

      // Update transformation status to failed
      if (transformationId && userId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("transformations")
          .update({
            status: "failed",
            error_message: errorText,
          })
          .eq("id", transformationId);
      }

      return {
        editStyleId,
        status: "failed",
        error: errorText,
        transformationId: transformationId || undefined,
      };
    }

    const falResult = await falResponse.json();

    if (!falResult.images || falResult.images.length === 0) {
      throw new Error("No images returned from FAL API");
    }

    const resultUrl = falResult.images[0].url;

    // Update transformation record with result
    if (transformationId && userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from("transformations")
        .update({
          result_url: resultUrl,
          status: "completed",
        })
        .eq("id", transformationId);
    }

    return {
      editStyleId,
      status: "completed",
      imageUrl: resultUrl,
      transformationId: transformationId || undefined,
    };
  } catch (error) {
    console.error(`Error transforming ${editStyleId}:`, error);
    return {
      editStyleId,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get FAL API key from environment
    const falApiKey = Deno.env.get("FAL_API_KEY");
    if (!falApiKey) {
      throw new Error("FAL_API_KEY not configured");
    }

    // Parse request body
    const {
      identityPhotoUrl,
      editStyles,
      userId,
      identityPhotoId,
    }: BatchTransformRequest = await req.json();

    // Validate required fields
    if (!identityPhotoUrl || !editStyles || editStyles.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: identityPhotoUrl, editStyles",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`Batch transforming ${editStyles.length} variations`);

    // Transform all edit styles sequentially
    const results: TransformResult[] = [];

    for (const editStyle of editStyles) {
      console.log(`Processing ${editStyle.id}...`);
      const result = await transformSingleImage(
        identityPhotoUrl,
        editStyle,
        falApiKey,
        userId,
        identityPhotoId
      );
      results.push(result);
    }

    const successCount = results.filter((r) => r.status === "completed").length;
    const failCount = results.filter((r) => r.status === "failed").length;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          completed: successCount,
          failed: failCount,
        },
        results,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in batch-transform function:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
