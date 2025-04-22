import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, MapPin, Edit } from "lucide-react";
import { User as CurrentUser } from "@/models/User";
import { useState } from "react";
import { supabaseCon } from "@/db_api/connection";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Form schema for profile editing
const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z
    .string()
    .max(200, {
      message: "Bio must be less than 200 characters.",
    })
    .optional(),
  avatar: z.string().optional(),
});

export default function EditProfilePage() {
  const { currentUser, isAuthenticated, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Initialize form with current user data
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: currentUser?.first_name || "",
      lastName: currentUser?.last_name || "",
      email: currentUser?.email || "",
      bio: currentUser?.bio || "",
      avatar: currentUser?.avatar || "",
    },
  });

  // Handle profile picture upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      // Convert file to base64 for the upload function
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Use the supabaseCon method to upload
      const { success, data } = await supabaseCon.uploadImagesToBucket(
        [base64Image],
        currentUser?.user_id
      );

      if (!success || !data) {
        throw new Error("Failed to upload image");
      }
      const avatarUrl = data[0];
      setNewAvatarUrl(avatarUrl);
      form.setValue("avatar", avatarUrl);
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setIsLoading(true);
    try {
      // Update profile in Supabase
      const res = await supabaseCon.updateProfile(
        currentUser?.user_id,
        values.firstName,
        values.lastName,
        values.bio,
        values.avatar
      );

      if (res.error) throw res.error;

      const updatedUserData: Partial<CurrentUser> = {
        first_name: values.firstName,
        last_name: values.lastName,
        bio: values.bio,
        avatar: values.avatar || currentUser?.avatar,
      };
      // Update email if changed
      if (values.email !== currentUser?.email) {
        const res = await supabaseCon.updateEmail(values.email);
        if (res.error) throw res.error;
        updatedUserData.email = values.email;
      }
      updateLocalUser(updatedUserData);
      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Edit Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-grambling-gold" />
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            Cancel
          </Button>
        </div>

        <Card className="tiger-card">
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={avatarPreview || currentUser?.avatar}
                        alt={`${currentUser?.first_name} ${currentUser?.last_name}`}
                      />
                      <AvatarFallback>
                        {currentUser?.first_name?.charAt(0)}
                        {currentUser?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-grambling-gold text-black rounded-full p-2 cursor-pointer hover:bg-grambling-gold/90"
                    >
                      <Edit className="h-4 w-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Click the icon to change your profile picture
                  </p>
                </div>

                <Separator />

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-grambling-gold" />
                    Personal Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Changing your email will require verification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Additional Information Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Additional Information
                  </h2>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Tell us about yourself..."
                            rows={3}
                            maxLength={200}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 200 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-grambling-gold text-black hover:bg-grambling-gold/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
