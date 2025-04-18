import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Filter, Search, Plus, Star } from "lucide-react";
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

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
      );
    }

    // Apply rate range filter
    filtered = filtered.filter(
      (service) => service.rate >= rateRange[0] && service.rate <= rateRange[1]
    );

    // Apply minimum rating filter
    if (minRating > 0) {
      filtered = filtered.filter((service) => service.rating >= minRating);
    }

    // Apply sorting
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

  // Get provider from mock data
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
        {/* Search and Sort Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 tiger-input"
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Services</SheetTitle>
                <SheetDescription>
                  Find the perfect service provider
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Rating</label>
                  <Select
                    value={minRating.toString()}
                    onValueChange={(val) => setMinRating(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      value={rateRange[0]}
                      onChange={(e) =>
                        setRateRange([Number(e.target.value), rateRange[1]])
                      }
                      className="tiger-input"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      min="0"
                      value={rateRange[1]}
                      onChange={(e) =>
                        setRateRange([rateRange[0], Number(e.target.value)])
                      }
                      className="tiger-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Highest Rated" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="most_reviews">Most Reviews</SelectItem>
                      <SelectItem value="price_low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price_high">
                        Price: High to Low
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-row justify-between sm:justify-between space-x-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <SheetClose asChild>
                  <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                    Apply Filters
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {isAuthenticated && (
            <Link to="/services/new">
              <Button
                size="icon"
                className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedCategory ||
          minRating > 0 ||
          rateRange[0] > 0 ||
          rateRange[1] < 500) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("")}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </div>
            )}

            {minRating > 0 && (
              <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                {minRating}+ Stars
                <button
                  onClick={() => setMinRating(0)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </div>
            )}

            {(rateRange[0] > 0 || rateRange[1] < 500) && (
              <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                ${rateRange[0]} - ${rateRange[1]}
                <button
                  onClick={() => setRateRange([0, 500])}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </div>
            )}

            <button
              onClick={resetFilters}
              className="text-xs text-grambling-gold hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Services */}
        <div className="space-y-3">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <Link to={`/services/${service.id}`} key={service.id}>
                <Card className="tiger-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {service.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-grambling-gold fill-grambling-gold" />
                            <span className="text-sm ml-1">
                              {service.rating}
                            </span>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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

        {/* Call to Action for Non-Authenticated Users */}
        {!isAuthenticated && (
          <Card className="bg-grambling-gold/10 border-grambling-gold/30">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold">Have a skill to offer?</h3>
              <p className="text-sm mb-3">Sign in to list your services</p>
              <Link to="/login">
                <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
