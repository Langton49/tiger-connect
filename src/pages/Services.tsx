import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Filter, Search, Plus, Star, MessageCircle } from "lucide-react";
import { mockServices, serviceCategories, Service } from "@/models/Service";
import { setUsers } from "@/models/User";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User } from "@/models/User";
import { setServiceListings } from "@/models/Service";

export default function Services() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [rateRange, setRateRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [originalServices, setOriginalServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [users, setOtherUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const listings = await setServiceListings();
      setOriginalServices(listings);
      setFilteredServices(listings);
    };

    const fetchUsers = async () => {
      const users = await setUsers();
      setOtherUsers(users);
    };

    fetchListings();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...originalServices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
      );
    }

    filtered = filtered.filter(
      (service) => service.rate >= rateRange[0] && service.rate <= rateRange[1]
    );

    if (minRating > 0) {
      filtered = filtered.filter((service) => service.rating >= minRating);
    }

    if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_low") {
      filtered.sort((a, b) => a.rate - b.rate);
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => b.rate - a.rate);
    } else if (sortBy === "most_reviews") {
      filtered.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategory, rateRange, minRating, sortBy]);

  const getProviderName = (providerId: string) => {
    const provider = users.find((user) => user.user_id === providerId);
    return provider
      ? provider.first_name + " " + provider.last_name
      : "Unknown Provider";
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setRateRange([0, 500]);
    setMinRating(0);
  };

  return (
    <AppLayout title="Services">
      <div className="space-y-4">
        {/* ... filter controls ... */}
        <div className="space-y-3">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <Card key={service.id} className="tiger-card">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Link to={`/services/${service.id}`}>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </Link>
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-grambling-gold fill-grambling-gold" />
                          <span className="text-sm ml-1">{service.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({service.reviewCount} reviews)
                          </span>
                        </div>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        By {getProviderName(service.provider_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${service.rate}
                        {service.rateType === "hourly" ? "/hr" : ""}
                      </div>
                      <div className="text-xs p-1 bg-grambling-gold/10 text-grambling-black rounded mt-2">
                        {service.availability[0]}
                      </div>
                      <div className="mt-2">
                        <Link to={`/messages/${service.provider_id}`}>
                          <MessageCircle className="w-5 h-5 text-grambling-gold hover:text-grambling-gold/80" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No services match your search criteria
              </p>
              <Button
                variant="link"
                onClick={resetFilters}
                className="text-grambling-gold mt-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
