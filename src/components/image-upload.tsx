import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    maxImages?: number;
}

export function ImageUpload({
    value = [],
    onChange,
    maxImages = 5,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    // In a real implementation with Supabase, this would upload to storage
    // For now, we're using a mock implementation
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        // Simulate file upload
        const imageUrls: string[] = [];

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    // Add the new image URL to our array
                    imageUrls.push(event.target.result as string);

                    // If we've processed all files, update the form
                    if (imageUrls.length === files.length) {
                        // Limit to maxImages
                        const updatedUrls = [...value, ...imageUrls].slice(
                            0,
                            maxImages
                        );
                        onChange(updatedUrls);
                        setIsUploading(false);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {value.map((url, index) => (
                    <div
                        key={index}
                        className="relative aspect-square rounded-md overflow-hidden border"
                    >
                        <img
                            src={url}
                            alt={`Uploaded image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {value.length < maxImages && (
                    <div className="aspect-square">
                        <label
                            htmlFor="imageUpload"
                            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-grambling-light rounded-md cursor-pointer hover:bg-grambling-gray/10"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-8 w-8 text-grambling-gold mb-2" />
                                <p className="text-sm text-gray-500">
                                    Upload {value.length > 0 ? "more" : ""}{" "}
                                    images
                                </p>
                            </div>
                            <input
                                id="imageUpload"
                                type="file"
                                accept="image/*"
                                multiple={maxImages > 1}
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="flex justify-center">
                    <p className="text-sm text-gray-500">Uploading...</p>
                </div>
            )}

            <p className="text-xs text-gray-500">
                {value.length}/{maxImages} images uploaded.
                {value.length < maxImages
                    ? ` You can upload ${maxImages - value.length} more.`
                    : ""}
            </p>
        </div>
    );
}
