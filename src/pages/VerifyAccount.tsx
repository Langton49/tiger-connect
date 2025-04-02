
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyAccount() {
  const [studentIdImage, setStudentIdImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { verifyAccount, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStudentIdImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real app, you would upload the image to your server
      // For this demo, we'll just simulate a successful verification
      const success = await verifyAccount();
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-grambling-gray p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Verify Student ID</CardTitle>
            <CardDescription>
              Upload a photo of your student ID to verify your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {studentIdImage ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 font-medium">File selected:</p>
                    <p className="text-sm">{studentIdImage.name}</p>
                    <button
                      type="button"
                      className="text-sm text-red-500 hover:text-red-700"
                      onClick={() => setStudentIdImage(null)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Drag and drop your student ID image here, or click to select
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
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Note: For security purposes, your student ID will be verified by our team.
                  This process typically takes 1-2 business days.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                disabled={isLoading || !studentIdImage}
              >
                {isLoading ? "Verifying..." : "Verify My Account"}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                For demo purposes, clicking the button will automatically verify your account
              </p>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-sm text-center text-gray-500">
              Having issues? Contact Student Services for assistance.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
