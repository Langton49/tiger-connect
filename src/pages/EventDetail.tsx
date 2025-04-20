import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Building,
  User,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { supabaseCon } from "@/db_api/connection";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  organizationPriority, 
  organizationTypeNames 
} from "@/models/Event";

interface EventDetail {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organization: {
    id: string;
    name: string;
    type: 'admin_faculty' | 'official_student' | 'general';
    verified: boolean;
  };
  creator: {
    first_name: string;
    last_name: string;
  };
  image_url?: string;
  created_at: Date;
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would have a specific API call to get a single event
        // For now, we'll get all events and filter
        const eventsData = await supabaseCon.getEvents();
        
        if (!eventsData.success) {
          setError("Failed to load event details");
          setLoading(false);
          return;
        }
        
        const foundEvent = eventsData.data.find(event => event.id === id);
        
        if (!foundEvent) {
          setError("Event not found");
          setLoading(false);
          return;
        }
        
        // Format dates
        setEvent({
          ...foundEvent,
          date: new Date(foundEvent.date),
          created_at: new Date(foundEvent.created_at)
        });
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  // Format date for display
  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  // Format time for display
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Get the organization type badge
  const getOrgTypeBadge = (type: string) => {
    switch(type) {
      case 'admin_faculty':
        return <Badge variant="destructive">Faculty/Admin</Badge>;
      case 'official_student':
        return <Badge variant="default" className="bg-grambling-gold text-black">Official Organization</Badge>;
      case 'general':
        return <Badge variant="outline">Club/Group</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppLayout title="Event Details">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg">Loading event details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !event) {
    return (
      <AppLayout title="Event Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-red-500 mb-4">{error || "Event not found"}</p>
          <Button onClick={() => navigate("/events")}>
            Back to Events
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={event.title}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Event Header */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex items-center mt-2">
                  <Building className="h-4 w-4 text-grambling-gold mr-2" />
                  <span className="text-gray-600 mr-2">{event.organization.name}</span>
                  {getOrgTypeBadge(event.organization.type)}
                </div>
              </div>
              <div>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="text-xl font-bold">{formatEventDate(event.date)}</p>
                  <p className="text-md">{formatEventTime(event.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Image */}
          {event.image_url ? (
            <div className="w-full h-[300px] md:h-[400px] relative">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-[200px] bg-gray-100 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Event Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Event Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
              </div>

              <div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3">Event Details</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CalendarDays className="h-5 w-5 text-grambling-gold mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-gray-600">{formatEventDate(event.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-grambling-gold mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-gray-600">{formatEventTime(event.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-grambling-gold mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Building className="h-5 w-5 text-grambling-gold mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Organized by</p>
                        <p className="text-gray-600">{event.organization.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {organizationTypeNames[event.organization.type]}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-grambling-gold mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Created by</p>
                        <p className="text-gray-600">
                          {event.creator.first_name} {event.creator.last_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 