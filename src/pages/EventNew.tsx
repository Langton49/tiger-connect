import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabaseCon } from "@/db_api/connection";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.date({
    required_error: "Event date is required",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  organization_id: z.string({
    required_error: "Organization is required",
  }),
  image: z.any().optional(),
});

export default function EventNew() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState("");

  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      time: "12:00",
    },
  });

  // Check if user can create events
  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      if (!currentUser?.user_id) {
        toast.error("Please log in to create events");
        navigate("/login");
        return;
      }

      try {
        console.log("Checking if user can create events:", currentUser.user_id);
        
        const result = await supabaseCon.canUserCreateEvents(currentUser.user_id);
        console.log("User event creation permission check result:", result);
        
        if (!result.success || !result.canCreate) {
          console.error("User cannot create events:", result);
          toast.error("You must be a verified member of an organization to create events");
          navigate("/events");
          return;
        }
        
        // User can create events, get their organizations
        console.log("Available organizations for events:", result.organizations);
        setUserOrganizations(result.organizations || []);
      } catch (error) {
        console.error("Error checking event creation permissions:", error);
        toast.error("Failed to verify permissions");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };
    
    checkPermissions();
  }, [currentUser, navigate]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size - limit to 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are allowed");
      return;
    }

    console.log(`Processing image: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    const reader = new FileReader();
    
    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue("image", base64String);
        console.log("Image processed successfully");
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        toast.error("Failed to process the selected image");
      }
    };
    
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      toast.error("Error reading the image file");
    };
    
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const eventDate = new Date(values.date);
      const [hours, minutes] = values.time.split(":").map(Number);
      eventDate.setHours(hours, minutes);
      
      console.log("Creating event with values:", {
        ...values,
        date: eventDate,
        hasImage: !!values.image
      });

      // Upload image if there is one
      let imageUrl = null;
      let imageUploadFailed = false;
      if (values.image) {
        try {
          console.log("Uploading event image...");
          const uploadResult = await supabaseCon.uploadEventImage(values.image, currentUser.user_id);
          if (uploadResult.success) {
            imageUrl = uploadResult.data;
            console.log("Image uploaded successfully:", imageUrl);
          } else {
            console.error("Failed to upload image:", uploadResult.error);
            
            // Check if this is a storage permission error
            if (uploadResult.error.includes('storage permissions') || 
                uploadResult.error.includes('bucket not available')) {
              imageUploadFailed = true;
              toast.warning("Could not upload image due to storage permissions. Creating event without image.");
            } else {
              toast.error("Failed to upload image: " + uploadResult.error);
            }
            // Continue without the image
          }
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast.error("Error uploading image. Creating event without image.");
          // Continue without the image
        }
      }
      
      // Create the event
      const result = await supabaseCon.createEvent(
        values.title,
        values.description,
        eventDate.toISOString(),
        values.location,
        values.organization_id,
        currentUser.user_id,
        imageUrl
      );
      
      if (result.success) {
        if (imageUploadFailed) {
          toast.success("Event created successfully, but without the image due to storage limitations");
        } else {
          toast.success("Event created successfully");
        }
        navigate(`/events/${result.data.id}`);
      } else {
        console.error("Failed to create event:", result.error);
        toast.error("Failed to create event: " + result.error);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get organization info to display
  const getOrganizationName = (id) => {
    const org = userOrganizations.find(o => o.organization_id === id);
    return org?.organizations?.name || "Unknown Organization";
  };

  return (
    <AppLayout title="Create Event">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Event</h1>
          <p className="text-gray-500">Share your organization's events with the campus community</p>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Checking permissions...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization */}
              <FormField
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the hosting organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userOrganizations.length === 0 ? (
                          <div className="p-2 text-center text-gray-500">
                            <p>No organizations available</p>
                            <p className="text-xs mt-1">You need to be a verified member of a verified organization to create events.</p>
                          </div>
                        ) : (
                          userOrganizations.map((org) => (
                            <SelectItem key={org.organization_id} value={org.organization_id}>
                              {org.organizations?.name || "Unknown Organization"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Time (24h format)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Image */}
              <div className="space-y-2">
                <FormLabel htmlFor="image">Event Image (Optional)</FormLabel>
                <Input 
                  id="image"
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <FormDescription>
                  Upload an image for your event (recommended size: 1200x630px)
                </FormDescription>
                
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Image Preview:</p>
                    <img 
                      src={imagePreview} 
                      alt="Event preview" 
                      className="max-h-[200px] rounded-md border"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/events")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-grambling-gold text-black hover:bg-grambling-gold/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Event...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AppLayout>
  );
} 