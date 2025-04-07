import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag,
  Briefcase,
  Calendar,
  Star,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mockEvents } from "@/models/Event";
import { mockListings } from "@/models/Marketplace";
import { mockServices } from "@/models/Service";

export default function Home() {
  const { currentUser, isAuthenticated } = useAuth();

  // Get most recent items for preview sections
  const featuredEvents = mockEvents.slice(0, 2);
  const featuredListings = mockListings.slice(0, 3);
  const featuredServices = mockServices.slice(0, 3);

  return (
    <AppLayout title="Tiger Life">
      <div className="space-y-6">
        {/* Welcome Hero */}
        <section className="bg-gradient-to-r from-grambling-black to-grambling-black/90 text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">
            {isAuthenticated
              ? `Welcome back, ${currentUser?.first_name?.split(" ")[0]}!`
              : "Welcome to Tiger Life"}
          </h1>
          <p className="mb-4 text-white/80">
            {isAuthenticated
              ? "Your one-stop platform for campus life at Grambling State."
              : "Connect with the Grambling community and access everything you need."}
          </p>
          {!isAuthenticated && (
            <div className="flex flex-wrap gap-3">
              <Link to="/login">
                <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="outline"
                  className="text-black border-white hover:bg-white/10"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Quick Access */}
        <section className="grid grid-cols-3 gap-3">
          <Link to="/marketplace" className="col-span-1">
            <Card className="h-24 tiger-card hover:border-grambling-gold transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full p-3">
                <ShoppingBag className="h-8 w-8 text-grambling-gold mb-1" />
                <span className="text-xs font-medium">Marketplace</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/services" className="col-span-1">
            <Card className="h-24 tiger-card hover:border-grambling-gold transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full p-3">
                <Briefcase className="h-8 w-8 text-grambling-gold mb-1" />
                <span className="text-xs font-medium">Services</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/events" className="col-span-1">
            <Card className="h-24 tiger-card hover:border-grambling-gold transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full p-3">
                <Calendar className="h-8 w-8 text-grambling-gold mb-1" />
                <span className="text-xs font-medium">Events</span>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Featured Events */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Link
              to="/events"
              className="text-grambling-gold text-sm flex items-center"
            >
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredEvents.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id}>
                <Card className="tiger-card">
                  <CardContent className="p-0">
                    <div className="aspect-[16/9] relative">
                      <img
                        src={
                          event.image ||
                          "https://via.placeholder.com/600x400?text=Event"
                        }
                        alt={event.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      <div className="absolute bottom-0 left-0 bg-grambling-black/70 text-white px-3 py-1 rounded-tr-lg text-xs">
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.attendeeCount} attending
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Marketplace Items */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Listings</h2>
            <Link
              to="/marketplace"
              className="text-grambling-gold text-sm flex items-center"
            >
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredListings.map((item) => (
              <Link to={`/marketplace/${item.id}`} key={item.id}>
                <Card className="tiger-card h-full">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={
                          item.images[0] ||
                          "https://via.placeholder.com/300x300?text=Item"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      <div className="absolute bottom-0 left-0 bg-grambling-gold text-grambling-black px-3 py-1 rounded-tr-lg font-semibold">
                        ${item.price}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.condition}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Popular Services</h2>
            <Link
              to="/services"
              className="text-grambling-gold text-sm flex items-center"
            >
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredServices.map((service) => (
              <Link to={`/services/${service.id}`} key={service.id}>
                <Card className="tiger-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {service.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-grambling-gold fill-grambling-gold" />
                          <span className="text-sm ml-1">{service.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({service.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${service.rate}
                          {service.rateType === "hourly" ? "/hr" : ""}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {service.category}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
