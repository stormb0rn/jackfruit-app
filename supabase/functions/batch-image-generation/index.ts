// Supabase Edge Function for batch image generation
// Queries prompts from database based on edit style IDs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_API_ENDPOINT = "https://fal.run/fal-ai/nano-banana/edit";

interface BatchImageGenerationRequest {
  identityPhotoUrl: string;
  editStyleIds: string[];  // 🔑 Changed: Now receives ID array instead of full edit styles
  userId?: string;
  identityPhotoId?: string;
}

interface EditStyle {
  id: string;
  prompt: string;
}

interface TransformResult {
  editStyleId: string;
  status: "completed" | "failed";
  imageUrl?: string;
  error?: string;
  transformationId?: string;
}

// Helper function to extract prompt text from various formats
function extractPromptText(prompts: any): string {
  if (!prompts) return '';
  if (typeof prompts === 'string') return prompts;
  if (Array.isArray(prompts) && prompts.length > 0) return prompts[0];
  if (typeof prompts === 'object') {
    return prompts.main || prompts.prompt || prompts.text || '';
  }
  return '';
}

// Query database for prompt by ID
async function getPromptById(supabase: any, editStyleId: string): Promise<string> {
  try {
    console.log(`[batch-image-generation] Querying prompt for ID: ${editStyleId}`);

    const { data, error } = await supabase
      .from('prompt_items')
      .select('prompts')
      .eq('id', editStyleId)
      .eq('category', 'looking')
      .eq('enabled', true)
      .single();

    if (error || !data) {
      throw new Error(`Prompt not found for ID: ${editStyleId}. Error: ${error?.message || 'Unknown error'}`);
    }

    const promptText = extractPromptText(data.prompts);
    if (!promptText) {
      throw new Error(`Prompt text is empty for ID: ${editStyleId}`);
    }

    console.log(`[batch-image-generation] Retrieved prompt for ${editStyleId}`);
    return promptText;
  } catch (error) {
    console.error(`[batch-image-generation] Error fetching prompt for ${editStyleId}:`, error);
    throw error;
  }
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
        aspect_ratio: "9:16",
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
      editStyleIds,  // 🔑 Changed: Now receives ID array
      userId,
      identityPhotoId,
    }: BatchImageGenerationRequest = await req.json();

    // Validate required fields
    if (!identityPhotoUrl || !editStyleIds || editStyleIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: identityPhotoUrl, editStyleIds",
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

    console.log(`[batch-image-generation] Batch generating images for ${editStyleIds.length} styles`);
    console.log(`[batch-image-generation] Edit style IDs:`, editStyleIds);

    // Initialize Supabase client for database queries
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query prompts from database for each ID
    const editStyles: EditStyle[] = [];
    const results: TransformResult[] = [];

    for (const editStyleId of editStyleIds) {
      try {
        const prompt = await getPromptById(supabase, editStyleId);
        editStyles.push({
          id: editStyleId,
          prompt,
        });
      } catch (error) {
        console.error(`[batch-image-generation] Failed to get prompt for ${editStyleId}:`, error);
        results.push({
          editStyleId,
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to retrieve prompt",
        });
      }
    }

    // Process the edit styles that were successfully loaded
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

      // Save successful generation to cached_generations table for reuse
      if (result.status === 'completed' && result.imageUrl && identityPhotoId) {
        try {
          await supabase
            .from('cached_generations')
            .insert({
              test_image_id: identityPhotoId,
              test_image_url: identityPhotoUrl,
              prompt_type: 'looking',
              prompt_id: editStyle.id,
              prompt_text: editStyle.prompt,
              generated_image_url: [result.imageUrl],  // JSONB array format
              is_admin_cache: false,
              generation_source: 'edit_look'
            });
          console.log(`[batch-image-generation] Saved cache for ${editStyle.id}`);
        } catch (cacheError) {
          console.warn(`[batch-image-generation] Failed to save cache for ${editStyle.id}:`, cacheError);
          // Don't fail the whole operation if caching fails
        }
      }
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
    console.error("[batch-image-generation] Error in batch-image-generation function:", error);

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
