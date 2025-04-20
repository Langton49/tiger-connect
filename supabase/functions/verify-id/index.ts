/// <reference types="https://deno.land/x/deno_types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ImageAnnotatorClient } from "https://esm.sh/@google-cloud/vision@4.0.2";

const serviceAccount = JSON.parse(
    Deno.env.get("GOOGLE_SERVICE_ACCOUNT") || "{}"
);

serve(async (req) => {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            throw new Error("Image URL is required");
        }

        const vision = new ImageAnnotatorClient({
            credentials: serviceAccount,
        });

        const [result] = await vision.textDetection(imageUrl);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            throw new Error("No text detected in image");
        }

        const fullText = detections[0].description;
        const textElements = detections.slice(1).map((d) => d.description);

        return new Response(
            JSON.stringify({
                success: true,
                fullText,
                textElements,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
});
