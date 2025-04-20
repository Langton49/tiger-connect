import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Filter, Search, Plus, Check, MessageCircle } from "lucide-react";
import { categories, MarketplaceItem } from "@/models/Marketplace";
import { setUsers } from "@/models/User";
import { User } from "@/models/User";
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
import { setListings } from "@/models/Marketplace";

export default function Marketplace() {
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [condition, setCondition] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("newest");
    const [originalListings, setOriginalListings] = useState<MarketplaceItem[]>([]);
    const [filteredListings, setFilteredListings] = useState<MarketplaceItem[]>([]);
    const [users, setOtherUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchListings = async () => {
            const listings = await setListings();
            setOriginalListings(listings);
            setFilteredListings(listings);
        };

        const fetchUsers = async () => {
            const users = await setUsers();
            setOtherUsers(users);
        };

        fetchListings();
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = [...originalListings];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter((item) => item.category === selectedCategory);
        }

        filtered = filtered.filter(
            (item) => item.price >= priceRange[0] && item.price <= priceRange[1]
        );

        if (condition) {
            filtered = filtered.filter((item) => item.condition === condition);
        }

        if (sortBy === "newest") {
            filtered.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        } else if (sortBy === "oldest") {
            filtered.sort(
                (a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        } else if (sortBy === "price_low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price_high") {
            filtered.sort((a, b) => b.price - a.price);
        }

        setFilteredListings(filtered);
    }, [
        searchQuery,
        selectedCategory,
        priceRange,
        condition,
        sortBy,
        originalListings,
    ]);

    const getSellerName = (sellerId: string) => {
        const seller = users.find((user) => user.user_id === sellerId);
        return seller
            ? seller.first_name + " " + seller.last_name
            : "Unknown Seller";
    };

    const resetFilters = () => {
        setSelectedCategory("");
        setPriceRange([0, 1000]);
        setCondition("");
        setSearchQuery("");
    };

    return (
        <AppLayout title="Marketplace">
            <div className="space-y-4">
                {/* ... other content ... */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredListings.length > 0 ? (
                        filteredListings.map((item) => (
                            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <Link to={`/product/${item.id}`}>
                                        <div className="aspect-square relative mb-4">
                                            <img
                                                src={item.images[0]}
                                                alt={item.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {item.description}
                                        </p>
                                    </Link>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg">${item.price}</p>
                                        <p className="text-sm text-gray-500">
                                            {getSellerName(item.seller_id)}
                                        </p>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <Link to={`/messages/${item.seller_id}`}>
                                            <MessageCircle className="w-5 h-5 text-grambling-gold hover:text-grambling-gold/80" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-500">
                                No items match your search criteria
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
