// Supabase Edge Function to transform images using FAL.AI nano-banana/edit
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_API_ENDPOINT = "https://fal.run/fal-ai/nano-banana/edit";

interface TransformRequest {
  identityPhotoUrl: string;
  prompt: string;
  editStyleId?: string;
  userId?: string;
  identityPhotoId?: string;
}

interface FALResponse {
  images: Array<{
    url: string;
    content_type: string;
    width: number;
    height: number;
  }>;
  description?: string;
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
      prompt,
      editStyleId,
      userId,
      identityPhotoId,
    }: TransformRequest = await req.json();

    // Validate required fields
    if (!identityPhotoUrl || !prompt) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: identityPhotoUrl, prompt",
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

    console.log("Transforming image with prompt:", prompt);

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

      if (dbError) {
        console.error("Database error:", dbError);
      } else {
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
      console.error("FAL API error:", errorText);

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

      throw new Error(`FAL API request failed: ${errorText}`);
    }

    const falResult: FALResponse = await falResponse.json();

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

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        transformationId,
        imageUrl: resultUrl,
        description: falResult.description,
        editStyleId,
        prompt: prompt,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in transform-image function:", error);

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
