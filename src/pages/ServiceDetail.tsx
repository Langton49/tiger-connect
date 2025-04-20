import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, MessageCircle, Calendar } from "lucide-react";
import { supabaseCon } from "@/db_api/connection.js";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Define the interface for our service data
interface ServiceData {
  id: string;
  title: string;
  description: string;
  rate: number;
  rateType: "hourly" | "fixed";
  category: string;
  provider_id: string;
  availability: string[];
  image: string;
  rating?: number;
  reviewCount?: number;
  created_at?: string;
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [service, setService] = useState<ServiceData | null>(null);
  const [providerName, setProviderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      try {
        // Fetch the service
        const { data: servicesData } = await supabaseCon.supabase
          .from("services_table")
          .select("*")
          .eq("id", id)
          .single();

        if (!servicesData) {
          setError("Service not found");
          setLoading(false);
          return;
        }

        setService(servicesData);

        // Fetch provider details
        const { data: userData } = await supabaseCon.supabase
          .from("user_table")
          .select("first_name, last_name")
          .eq("user_id", servicesData.provider_id)
          .single();

        if (userData) {
          setProviderName(`${userData.first_name} ${userData.last_name}`);
        }
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError("Failed to load service details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  const handleMessageProvider = () => {
    if (!currentUser) {
      toast.error("Please log in to message the provider");
      navigate("/login");
      return;
    }

    if (service && service.provider_id) {
      navigate(`/messages/${service.provider_id}`);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Service Details">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg">Loading service details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !service) {
    return (
      <AppLayout title="Service Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-lg text-red-500 mb-4">{error || "Service not found"}</p>
          <Button onClick={() => navigate("/services")}>
            Back to Services
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={service.title}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => navigate("/services")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="overflow-hidden mb-6">
              {service.image && (
                <div className="relative aspect-video">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
                  <div className="flex items-center mb-4">
                    <p className="text-lg font-semibold">Provider: {providerName}</p>
                    {service.rating && (
                      <div className="flex items-center ml-4">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span>{service.rating.toFixed(1)}</span>
                        {service.reviewCount && (
                          <span className="text-sm text-gray-500 ml-1">({service.reviewCount} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center mb-4">
                    <p className="text-xl font-bold">
                      ${service.rate} {service.rateType === "hourly" ? "/hour" : " fixed"}
                    </p>
                    <span className="ml-4 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Availability</h2>
                  <div className="flex flex-wrap gap-2">
                    {service.availability && service.availability.map((day) => (
                      <div key={day} className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        <Calendar className="h-4 w-4 mr-1" />
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full sm:w-auto flex items-center justify-center" 
                  onClick={handleMessageProvider}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message Provider
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About the Provider</h2>
                <p className="mb-4">{providerName}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Member since {service.created_at && new Date(service.created_at).toLocaleDateString()}
                </p>
                <Button 
                  className="w-full flex items-center justify-center" 
                  onClick={handleMessageProvider}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 