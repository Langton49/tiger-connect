import { supabaseCon } from "@/db_api/connection";
import heic2any from "heic2any";

interface ExtractedIDInfo {
    studentId: string;
    name: string;
    isValid: boolean;
    confidence: number;
}

export class IDVerificationService {
    private async convertHeicToJpeg(file: File): Promise<File> {
        if (file.type === "image/heic" || file.type === "image/heif") {
            try {
                const blob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8,
                });
                return new File(
                    [blob as Blob],
                    file.name.replace(/\.heic$/i, ".jpg"),
                    {
                        type: "image/jpeg",
                    }
                );
            } catch (error) {
                console.error("HEIC conversion error:", error);
                throw new Error(
                    "Failed to convert HEIC image. Please try uploading a JPEG or PNG file."
                );
            }
        }
        return file;
    }

    async verifyID(
        imageFile: File,
        registeredStudentId: string,
        registeredName: string
    ): Promise<ExtractedIDInfo> {
        try {
            if (!imageFile.type.startsWith("image/")) {
                throw new Error("Please upload a valid image file");
            }

            if (!registeredStudentId || !registeredName) {
                throw new Error("Missing student ID or name for verification.");
            }

            console.log("🔍 Verifying student ID:", registeredStudentId);

            const processableImage = await this.convertHeicToJpeg(imageFile);

            // Check if ID has already been verified
            const { data: existingVerification, error: queryError } =
                await supabaseCon.supabase
                    .from("verified_ids")
                    .select("*")
                    .eq("student_id", registeredStudentId)
                    .single();

            if (queryError && queryError.code !== "PGRST116") {
                throw queryError;
            }

            if (existingVerification) {
                throw new Error("This student ID has already been verified");
            }

            // Upload image to Supabase Storage
            const fileExt = processableImage.name.split(".").pop();
            const fileName = `${registeredStudentId}-${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } =
                await supabaseCon.supabase.storage
                    .from("student-ids")
                    .upload(fileName, processableImage, {
                        cacheControl: "3600",
                        upsert: false,
                    });

            if (uploadError) {
                throw new Error("Failed to upload ID image");
            }

            // Get the public URL for the uploaded image
            const {
                data: { publicUrl },
            } = supabaseCon.supabase.storage
                .from("student-ids")
                .getPublicUrl(fileName);

            // Call the verify-id edge function that uses Google Cloud Vision API
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-id`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${
                            import.meta.env.VITE_SUPABASE_ANON_KEY
                        }`,
                    },
                    body: JSON.stringify({ imageUrl: publicUrl }),
                }
            );

            if (!response.ok) {
                // Clean up the uploaded image if verification fails
                await supabaseCon.supabase.storage
                    .from("student-ids")
                    .remove([fileName]);
                throw new Error("Failed to verify ID");
            }

            const { fullText, textElements } = await response.json();
            console.log("🧾 OCR Extracted Text:", fullText);

            // Validate the extracted information
            const studentIdMatch = fullText.match(/G\d{8}/i);
            const extractedStudentId = studentIdMatch
                ? studentIdMatch[0].toUpperCase()
                : "";

            const [firstName, lastName] = registeredName.split(" ");
            const firstNameMatch = fullText
                .toLowerCase()
                .includes(firstName.toLowerCase());
            const lastNameMatch = fullText
                .toLowerCase()
                .includes(lastName.toLowerCase());

            const isValid =
                extractedStudentId === registeredStudentId &&
                firstNameMatch &&
                lastNameMatch;

            if (!isValid) {
                // Clean up the uploaded image if validation fails
                await supabaseCon.supabase.storage
                    .from("student-ids")
                    .remove([fileName]);
                return {
                    studentId: extractedStudentId,
                    name: registeredName,
                    isValid: false,
                    confidence: 0,
                };
            }

            // Store verification record in the database
            const { error: dbError } = await supabaseCon.supabase
                .from("verified_ids")
                .insert([
                    {
                        student_id: registeredStudentId,
                        verification_date: new Date().toISOString(),
                        image_url: publicUrl,
                        extracted_text: fullText,
                        confidence_score: 1,
                    },
                ]);

            if (dbError) {
                await supabaseCon.supabase.storage
                    .from("student-ids")
                    .remove([fileName]);
                throw new Error("Failed to store verification record");
            }

            return {
                studentId: extractedStudentId,
                name: registeredName,
                isValid: true,
                confidence: 1,
            };
        } catch (error) {
            console.error("ID verification error:", error);
            throw error;
        }
    }
}
