import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Bell,
  MessageSquare,
  Lock,
  CreditCard,
  User,
  Mail,
  Shield,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabaseCon } from "@/db_api/connection";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Form schemas for different settings sections
const notificationSchema = z.object({
  email_notifications: z.boolean(),
});

const messageSchema = z.object({
  message_sound: z.boolean(),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
    email_verification_enabled: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export default function SettingsPage() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Notification form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: false,
    },
  });

  // Message form
  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message_sound: true,
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email_verification_enabled: false,
    },
  });

  // Handle notification settings submission
  const onNotificationSubmit = async (
    values: z.infer<typeof notificationSchema>
  ) => {
    setIsLoading(true);
    try {
      const res = await supabaseCon.updateSettings(
        currentUser?.user_id,
        values
      );
      if (!res.success) throw new Error(res.error);
      toast.success("Notification settings updated successfully");
    } catch (error) {
      toast.error("Failed to update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message settings submission
  const onMessageSubmit = async (values: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const res = await supabaseCon.updateSettings(
        currentUser?.user_id,
        values
      );
      if (!res.success) throw new Error(res.error);
      toast.success("Message settings updated successfully");
    } catch (error) {
      toast.error("Failed to update message settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      // Update password in Supabase
      const { error } = await supabaseCon.updatePassword(
        currentUser.user_id,
        values.newPassword
      );

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailVerificationSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await supabaseCon.enableMFA(
        currentUser?.user_id,
        currentUser?.email
      );
      if (!res.success) throw new Error(res.error);
      toast.success("Message settings updated successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    onEmailVerificationSubmit();
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-6">
        {/* Settings Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-grambling-gold" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            {" "}
            {/* Changed from grid-cols-4 */}
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="tiger-card">
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-grambling-gold" />
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Manage how you receive notifications from Grambling Connect
                </p>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form
                    onSubmit={notificationForm.handleSubmit(
                      onNotificationSubmit
                    )}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="email_notifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive important updates via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="bg-grambling-gold text-black hover:bg-grambling-gold/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Notification Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="tiger-card">
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-grambling-gold" />
                  Message Settings
                </h2>
                <p className="text-sm text-gray-500">
                  Control how you send and receive messages
                </p>
              </CardHeader>
              <CardContent>
                <Form {...messageForm}>
                  <form
                    onSubmit={messageForm.handleSubmit(onMessageSubmit)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={messageForm.control}
                        name="message_sound"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Message Sound
                              </FormLabel>
                              <FormDescription>
                                Play sound when receiving new messages
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="bg-grambling-gold text-black hover:bg-grambling-gold/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Message Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="tiger-card">
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-grambling-gold" />
                  Security Settings
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your account security and password
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Password Form */}
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <h3 className="font-medium">Change Password</h3>
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter current password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="bg-grambling-gold text-black hover:bg-grambling-gold/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>

                <Separator />

                {/* Security Recommendations */}
                <div>
                  <h3 className="font-medium mb-3">Security Recommendations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Email Verification</p>
                          <p className="text-sm text-gray-500">
                            Verify your email for account recovery
                          </p>
                        </div>
                      </div>
                      {currentUser?.email ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <Button variant="outline" size="sm">
                          Verify Now
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleButtonClick}
                      >
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
