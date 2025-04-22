import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseCon } from "@/db_api/connection.js";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
import { serviceCategories } from "@/models/Service";
import { ImageUpload } from "@/components/image-upload";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  rate: z.coerce.number().positive({
    message: "Rate must be a positive number.",
  }),
  rateType: z.enum(["hourly", "fixed"]),
  category: z.string({
    required_error: "Please select a category.",
  }),
  availability: z.array(z.string()).min(1, {
    message: "Please add at least one availability slot.",
  }),
  image: z.string().optional(),
});

export default function ServicesNew() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityInput, setAvailabilityInput] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      rate: undefined,
      rateType: "hourly",
      category: "",
      availability: [],
      image: "",
    },
  });

  // ✅ useEffect for redirect side effect
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const listingResult = await supabaseCon.listServices(
        values.title,
        values.description,
        values.rate,
        values.rateType,
        values.category,
        currentUser?.user_id,
        values.availability,
        values.image
      );

      if (!listingResult.success) {
        console.error("Service listing failed:", listingResult.error);
        toast.error("Failed to list service: " + listingResult.error);
        setIsSubmitting(false);
        return;
      }

      console.log("Service listing successful, data:", listingResult.data);

      // Create notification for the new service
      try {
        // Get the service ID from the response
        let serviceId;

        if (
          Array.isArray(listingResult.data) &&
          listingResult.data.length > 0
        ) {
          serviceId = listingResult.data[0]?.id;
          console.log("Found service ID from array:", serviceId);
        } else if (
          listingResult.data &&
          typeof listingResult.data === "object"
        ) {
          serviceId = listingResult.data.id;
          console.log("Found service ID from object:", serviceId);
        } else {
          console.log("Data returned:", JSON.stringify(listingResult.data));
        }

        if (serviceId) {
          console.log(
            `Creating notification for service ID: ${serviceId} and user ID: ${currentUser?.user_id}`
          );
          const notificationResult =
            await supabaseCon.createNewServiceNotification(
              currentUser?.user_id,
              serviceId,
              values.title
            );

          if (notificationResult.success) {
            console.log("Service notification created successfully");
          } else {
            console.error(
              "Service notification creation failed:",
              notificationResult.error
            );
          }
        } else {
          console.warn(
            "Service ID not found in response, skipping notification creation"
          );
        }
      } catch (notificationError) {
        // If notification creation fails, just log it but don't fail the whole operation
        console.error(
          "Error creating service notification:",
          notificationError
        );
      }

      toast.success("Service listed successfully!");

      // Force a refresh of notifications before navigation
      try {
        // This will fire an event that the app-header listens for
        const refreshEvent = new CustomEvent("refreshNotifications");
        window.dispatchEvent(refreshEvent);
      } catch (e) {
        console.error("Failed to trigger notification refresh:", e);
      }

      // Navigate to services after a slight delay to allow notifications to be created
      setTimeout(() => {
        navigate("/services");
      }, 300);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to list service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAvailability = () => {
    if (availabilityInput.trim()) {
      const current = form.getValues("availability") || [];
      form.setValue("availability", [...current, availabilityInput.trim()]);
      setAvailabilityInput("");
    }
  };

  const removeAvailability = (index: number) => {
    const current = form.getValues("availability") || [];
    form.setValue(
      "availability",
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <AppLayout title="List Your Service">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image (Optional)</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] || "")}
                    maxImages={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Math & Science Tutoring"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your service in detail..."
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hourly">Per Hour</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="e.g., Mon 3–7PM"
                      value={availabilityInput}
                      onChange={(e) => setAvailabilityInput(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={addAvailability}
                      size="icon"
                      className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.getValues("availability")?.map((time, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-grambling-gold/20 text-grambling-black text-sm py-1 px-2 rounded-full"
                      >
                        {time}
                        <button
                          type="button"
                          onClick={() => removeAvailability(index)}
                          className="ml-1 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Listing..." : "List Your Service"}
          </Button>
        </form>
      </Form>
    </AppLayout>
  );
}
