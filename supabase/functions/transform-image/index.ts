// Supabase Edge Function to transform images using FAL.AI nano-banana/edit
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_API_ENDPOINT = "https://fal.run/fal-ai/nano-banana/edit";

interface TransformRequest {
  identityPhotoUrl: string;
  lookingType: string;
  visualStyle: string;
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

// Transformation prompt configuration
const LOOKING_PROMPTS: Record<string, string> = {
  better_looking: "better-looking, enhanced features, more attractive, refined appearance",
  japanese_looking: "Japanese appearance, East Asian features, Japanese ethnicity",
  more_male: "more masculine, stronger male features, masculine appearance",
  more_female: "more feminine, softer female features, feminine appearance",
  white_skinned: "white skin tone, fair skin, light complexion",
  dark_skinned: "dark skin tone, deep complexion, darker skin",
};

const VISUAL_STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, realistic lighting, high detail, lifelike",
  game_render_realistic: "game engine render, Unreal Engine style, realistic game graphics, 3D game character",
  "2d_cartoon": "2D cartoon style, animated illustration, cartoon art, flat shading",
  "3d_cartoon": "3D cartoon style, Pixar style, stylized 3D, cartoon render",
};

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
      lookingType,
      visualStyle,
      userId,
      identityPhotoId,
    }: TransformRequest = await req.json();

    // Validate required fields
    if (!identityPhotoUrl || !lookingType || !visualStyle) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: identityPhotoUrl, lookingType, visualStyle",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build prompt from configuration
    const lookingPrompt = LOOKING_PROMPTS[lookingType];
    const stylePrompt = VISUAL_STYLE_PROMPTS[visualStyle];

    if (!lookingPrompt || !stylePrompt) {
      return new Response(
        JSON.stringify({
          error: "Invalid lookingType or visualStyle",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const combinedPrompt = `${lookingPrompt}, ${stylePrompt}`;

    console.log("Transforming image with prompt:", combinedPrompt);

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
          looking_type: lookingType,
          visual_style: visualStyle,
          prompt: combinedPrompt,
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
        prompt: combinedPrompt,
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
        lookingType,
        visualStyle,
        prompt: combinedPrompt,
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
