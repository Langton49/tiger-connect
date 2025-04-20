import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabaseCon } from "@/db_api/connection";

export default function VerifyAccount() {
    const [studentIdImage, setStudentIdImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(
        null
    );
    const { verifyAccount, currentUser } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        }
    }, [currentUser, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an image file",
                    variant: "destructive",
                });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please upload an image smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }
            setStudentIdImage(file);
            setVerificationError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !studentIdImage) return;

        setIsLoading(true);
        setVerificationError(null);

        try {
            // Upload image to Supabase Storage
            const fileExt = studentIdImage.name.split(".").pop();
            const fileName = `${currentUser.g_number}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabaseCon
                .getClient()
                .storage.from("student-ids")
                .upload(fileName, studentIdImage, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw new Error("Failed to upload ID image");

            // Get the public URL
            const {
                data: { publicUrl },
            } = supabaseCon
                .getClient()
                .storage.from("student-ids")
                .getPublicUrl(fileName);

            // Get the session
            const {
                data: { session },
            } = await supabaseCon.getClient().auth.getSession();
            if (!session?.access_token) {
                throw new Error("No valid session found");
            }

            // Call the verify-id edge function
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-id`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ imageUrl: publicUrl }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Verification failed");
            }

            const extractedText = data.fullText;

            // Validate student ID and name in extracted text
            const studentIdRegex = new RegExp(currentUser.g_number, "i");
            const [firstName, lastName] =
                `${currentUser.first_name} ${currentUser.last_name}`.split(" ");
            const nameRegex = new RegExp(
                `${firstName}.*${lastName}|${lastName}.*${firstName}`,
                "i"
            );

            const isValid =
                studentIdRegex.test(extractedText) &&
                nameRegex.test(extractedText);

            if (!isValid) {
                setVerificationError(
                    "Could not verify student ID information. Please ensure the image is clear and contains your ID number and name."
                );
                await supabaseCon
                    .getClient()
                    .storage.from("student-ids")
                    .remove([fileName]);
                return;
            }

            // Store verification record
            const { error: dbError } = await supabaseCon
                .getClient()
                .from("verified_ids")
                .insert([
                    {
                        student_id: currentUser.g_number,
                        verification_date: new Date().toISOString(),
                        image_url: publicUrl,
                        extracted_text: extractedText,
                        confidence_score: 1,
                    },
                ]);

            if (dbError) {
                await supabaseCon
                    .getClient()
                    .storage.from("student-ids")
                    .remove([fileName]);
                throw new Error("Failed to store verification record");
            }

            // Update user's verified status
            const verificationResult = await verifyAccount();
            if (verificationResult) {
                toast({
                    title: "Verification Successful",
                    description: "Your student ID has been verified!",
                });
                navigate("/");
            }
        } catch (error) {
            console.error("Verification error:", error);
            setVerificationError("Failed to verify ID. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-grambling-gray p-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle>Verify Student ID</CardTitle>
                        <CardDescription>
                            Upload a clear photo of your student ID to verify
                            your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {studentIdImage ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-green-600 font-medium">
                                            File selected:
                                        </p>
                                        <p className="text-sm">
                                            {studentIdImage.name}
                                        </p>
                                        <button
                                            type="button"
                                            className="text-sm text-red-500 hover:text-red-700"
                                            onClick={() =>
                                                setStudentIdImage(null)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500">
                                            Drag and drop your student ID image
                                            here, or click to select
                                        </p>
                                        <label className="inline-block cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm">
                                            Browse Files
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {verificationError && (
                                <div className="text-sm text-red-500 text-center">
                                    {verificationError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">
                                    Note: For security purposes, your student ID
                                    will be verified using advanced OCR
                                    technology. Please ensure the image is clear
                                    and well-lit.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                                disabled={isLoading || !studentIdImage}
                            >
                                {isLoading
                                    ? "Verifying..."
                                    : "Verify My Account"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <div className="text-sm text-center text-gray-500">
                            Having issues? Contact Student Services for
                            assistance.
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
