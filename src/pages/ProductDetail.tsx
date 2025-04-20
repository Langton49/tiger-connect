import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { MarketplaceItem, setListings } from "@/models/Marketplace";
import { setUsers } from "@/models/User";
import { User } from "@/models/User";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";

interface Review {
    id: number;
    user: string;
    rating: number;
    comment: string;
    date: string;
}

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState<MarketplaceItem | null>(null);
    const [users, setOtherUsers] = useState<User[]>([]);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            const listings = await setListings();
            const foundProduct = listings.find((item) => item.id === id);
            setProduct(foundProduct || null);
        };

        const fetchUsers = async () => {
            const users = await setUsers();
            setOtherUsers(users);
        };

        fetchProduct();
        fetchUsers();
    }, [id]);

    // Sample reviews - replace with actual reviews from your backend
    const reviews: Review[] = [
        {
            id: 1,
            user: "John D.",
            rating: 5,
            comment:
                "Great quality hoodie! The material is thick and comfortable. Perfect for game days!",
            date: "2024-04-15",
        },
        {
            id: 2,
            user: "Sarah M.",
            rating: 4,
            comment:
                "Love the design and fit. Only giving 4 stars because the sizing runs a bit small.",
            date: "2024-04-10",
        },
    ];

    const handleBuyNow = () => {
        if (!product) return;
        addToCart(product, quantity);
        navigate("/checkout");
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, quantity);
        toast({
            title: "Added to cart",
            description: `${quantity} ${product.title} added to your cart.`,
        });
    };

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Product not found</h1>
                    <p className="text-gray-600">
                        The product you're looking for doesn't exist or has been
                        removed.
                    </p>
                </div>
            </div>
        );
    }

    // Get seller from users data
    const getSellerName = (sellerId: string) => {
        const seller = users.find((user) => user.user_id === sellerId);
        return seller
            ? `${seller.first_name} ${seller.last_name}`
            : "Unknown Seller";
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative">
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full rounded-lg shadow-lg"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4"
                    >
                        <Heart className="h-6 w-6" />
                    </Button>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{product.title}</h1>
                    <p className="text-2xl font-semibold">${product.price}</p>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-600">
                                {product.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Condition</h3>
                            <p className="text-gray-600">{product.condition}</p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Seller</h3>
                            <div className="flex items-center justify-between">
                                <p className="text-gray-600">
                                    {getSellerName(product.seller_id)}
                                </p>
                                <Button 
                                    variant="link" 
                                    className="text-grambling-gold p-0"
                                    onClick={() => navigate(`/messages/${product.seller_id}`)}
                                >
                                    Message Seller
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Quantity</h3>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setQuantity(Math.max(1, quantity - 1))
                                    }
                                >
                                    -
                                </Button>
                                <span className="w-8 text-center">
                                    {quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                className="flex-1"
                                size="lg"
                                onClick={handleBuyNow}
                            >
                                Buy Now
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <Card key={review.id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">
                                        {review.user}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {review.date}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${
                                                i < review.rating
                                                    ? "text-yellow-400 fill-current"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600">{review.comment}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
