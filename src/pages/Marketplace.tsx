
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Filter, Search, Plus, Check } from "lucide-react";
import { mockListings, categories, MarketplaceItem } from "@/models/Marketplace";
import { mockUsers } from "@/models/User";
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

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [condition, setCondition] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [filteredListings, setFilteredListings] = useState<MarketplaceItem[]>(mockListings);

  useEffect(() => {
    let filtered = [...mockListings];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(query) || 
          item.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply price range filter
    filtered = filtered.filter(
      item => item.price >= priceRange[0] && item.price <= priceRange[1]
    );
    
    // Apply condition filter
    if (condition) {
      filtered = filtered.filter(item => item.condition === condition);
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (sortBy === "price_low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    setFilteredListings(filtered);
  }, [searchQuery, selectedCategory, priceRange, condition, sortBy]);

  // Get seller from mock data
  const getSellerName = (sellerId: string) => {
    const seller = mockUsers.find(user => user.id === sellerId);
    return seller ? seller.name : "Unknown Seller";
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 1000]);
    setCondition("");
  };

  return (
    <AppLayout title="Marketplace">
      <div className="space-y-4">
        {/* Search and Sort Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items..."
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
                <SheetTitle>Filter Items</SheetTitle>
                <SheetDescription>
                  Narrow down your marketplace search
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condition</label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Condition</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      min="0" 
                      value={priceRange[0]} 
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} 
                      className="tiger-input"
                    />
                    <span>to</span>
                    <Input 
                      type="number" 
                      min="0" 
                      value={priceRange[1]} 
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} 
                      className="tiger-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
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
            <Link to="/marketplace/new">
              <Button size="icon" className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        
        {/* Active Filters Display */}
        {(selectedCategory || condition || priceRange[0] > 0 || priceRange[1] < 1000) && (
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
            
            {condition && (
              <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                {condition}
                <button 
                  onClick={() => setCondition("")}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </div>
            )}
            
            {(priceRange[0] > 0 || priceRange[1] < 1000) && (
              <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                ${priceRange[0]} - ${priceRange[1]}
                <button 
                  onClick={() => setPriceRange([0, 1000])}
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
        
        {/* Listings */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <Link to={`/marketplace/${item.id}`} key={item.id} className="col-span-1">
                <Card className="tiger-card h-full">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img 
                        src={item.images[0] || "https://via.placeholder.com/300x300?text=Item"} 
                        alt={item.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      <div className="absolute bottom-0 left-0 bg-grambling-gold text-grambling-black px-2 py-1 rounded-tr-lg font-semibold text-sm">
                        ${item.price}
                      </div>
                      {item.status !== "Available" && (
                        <div className="absolute top-0 right-0 bg-grambling-black text-white px-2 py-1 rounded-bl-lg text-xs flex items-center">
                          {item.status === "Sold" && <Check className="h-3 w-3 mr-1" />}
                          {item.status}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">{item.condition}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getSellerName(item.sellerId)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">No items match your search criteria</p>
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
              <h3 className="font-semibold">Want to sell something?</h3>
              <p className="text-sm mb-3">Sign in to post your items for sale</p>
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
