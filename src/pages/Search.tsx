import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, MessageCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { setListings, MarketplaceItem } from "@/models/Marketplace";
import { setServiceListings, Service } from "@/models/Service";
import { setUsers } from "@/models/User";
import { User } from "@/models/User";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setOtherUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(!!initialQuery);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch marketplace items
      const listings = await setListings();
      setMarketplaceItems(listings);

      // Fetch services
      const serviceListings = await setServiceListings();
      setServices(serviceListings);

      // Fetch users for name display
      const userData = await setUsers();
      setOtherUsers(userData);
    };

    fetchData();
  }, []);

  // Update URL when search query changes
  const handleSearch = () => {
    setIsSearching(true);
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  // Filter items based on search query
  const filteredMarketplaceItems = marketplaceItems.filter(
    (item) =>
      searchQuery &&
      (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter services based on search query
  const filteredServices = services.filter(
    (service) =>
      searchQuery &&
      (service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get combined results for "All" tab
  const allResults = [...filteredMarketplaceItems, ...filteredServices];

  const getSellerName = (sellerId: string) => {
    const seller = users.find((user) => user.user_id === sellerId);
    return seller
      ? seller.first_name + " " + seller.last_name
      : "Unknown User";
  };

  return (
    <AppLayout title="Search">
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search for marketplace items, services..."
            className="pl-10 pr-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>

        {searchQuery && (
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all">
                All ({allResults.length})
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                Marketplace ({filteredMarketplaceItems.length})
              </TabsTrigger>
              <TabsTrigger value="services">
                Services ({filteredServices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allResults.length > 0 ? (
                allResults.map((item) => {
                  const isMarketplaceItem = "price" in item;
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 shrink-0">
                            <img
                              src={isMarketplaceItem ? (item as MarketplaceItem).images[0] : (item as Service).image}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <Link to={isMarketplaceItem ? `/product/${item.id}` : `/services/${item.id}`}>
                                <h3 className="font-semibold">{item.title}</h3>
                              </Link>
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                {isMarketplaceItem ? "Marketplace" : "Service"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <div>
                                {isMarketplaceItem ? (
                                  <span className="font-semibold">${(item as MarketplaceItem).price}</span>
                                ) : (
                                  <div className="flex items-center">
                                    <span className="font-semibold">${(item as Service).rate}</span>
                                    {(item as Service).rateType === "hourly" && <span className="text-sm">/hr</span>}
                                    <span className="mx-2">•</span>
                                    <div className="flex items-center">
                                      <Star className="h-3 w-3 text-grambling-gold fill-grambling-gold" />
                                      <span className="text-sm ml-1">{(item as Service).rating}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">
                                  {getSellerName(isMarketplaceItem ? (item as MarketplaceItem).seller_id : (item as Service).provider_id)}
                                </span>
                                <Link to={`/messages/${isMarketplaceItem ? (item as MarketplaceItem).seller_id : (item as Service).provider_id}`} className="ml-2">
                                  <MessageCircle className="w-4 h-4 text-grambling-gold hover:text-grambling-gold/80" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No results found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4">
              {filteredMarketplaceItems.length > 0 ? (
                filteredMarketplaceItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 shrink-0">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-semibold">{item.title}</h3>
                          </Link>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-semibold">${item.price}</span>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">
                                {getSellerName(item.seller_id)}
                              </span>
                              <Link to={`/messages/${item.seller_id}`} className="ml-2">
                                <MessageCircle className="w-4 h-4 text-grambling-gold hover:text-grambling-gold/80" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No marketplace items found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 shrink-0">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <Link to={`/services/${service.id}`}>
                            <h3 className="font-semibold">{service.title}</h3>
                          </Link>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {service.description}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">
                              <span className="font-semibold">${service.rate}</span>
                              {service.rateType === "hourly" && <span className="text-sm">/hr</span>}
                              <span className="mx-2">•</span>
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-grambling-gold fill-grambling-gold" />
                                <span className="text-sm ml-1">{service.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">
                                {getSellerName(service.provider_id)}
                              </span>
                              <Link to={`/messages/${service.provider_id}`} className="ml-2">
                                <MessageCircle className="w-4 h-4 text-grambling-gold hover:text-grambling-gold/80" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No services found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <SearchIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Search Tiger Connect</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a search term above to find marketplace items, services, and more.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 