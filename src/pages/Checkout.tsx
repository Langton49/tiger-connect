import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
}

export default function Checkout() {
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: keyof FormData
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Here you would typically:
        // 1. Validate the form data
        // 2. Process the payment
        // 3. Create the order in your backend
        // 4. Send confirmation email
        // 5. Clear the cart
        // 6. Redirect to success page

        // For now, we'll just simulate a successful order
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            clearCart();
            toast({
                title: "Order placed successfully!",
                description: "Thank you for your purchase.",
            });
            navigate("/order-success");
        } catch (error) {
            toast({
                title: "Error",
                description:
                    "There was a problem processing your order. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (items.length === 0) {
        navigate("/cart");
        return null;
    }

    return (
        <AppLayout title="Checkout">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Checkout Form */}
                    <div>
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">
                                    Shipping Information
                                </h2>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">
                                                First Name
                                            </Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        e,
                                                        "firstName"
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">
                                                Last Name
                                            </Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        e,
                                                        "lastName"
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                handleInputChange(e, "email")
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) =>
                                                handleInputChange(e, "address")
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={formData.city}
                                                onChange={(e) =>
                                                    handleInputChange(e, "city")
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input
                                                id="state"
                                                value={formData.state}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        e,
                                                        "state"
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode">
                                            ZIP Code
                                        </Label>
                                        <Input
                                            id="zipCode"
                                            value={formData.zipCode}
                                            onChange={(e) =>
                                                handleInputChange(e, "zipCode")
                                            }
                                            required
                                        />
                                    </div>

                                    <h2 className="text-2xl font-bold mb-6">
                                        Payment Information
                                    </h2>

                                    <div className="space-y-2">
                                        <Label htmlFor="cardNumber">
                                            Card Number
                                        </Label>
                                        <Input
                                            id="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    e,
                                                    "cardNumber"
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cardName">
                                            Name on Card
                                        </Label>
                                        <Input
                                            id="cardName"
                                            value={formData.cardName}
                                            onChange={(e) =>
                                                handleInputChange(e, "cardName")
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiryDate">
                                                Expiry Date
                                            </Label>
                                            <Input
                                                id="expiryDate"
                                                placeholder="MM/YY"
                                                value={formData.expiryDate}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        e,
                                                        "expiryDate"
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvv">CVV</Label>
                                            <Input
                                                id="cvv"
                                                type="password"
                                                maxLength={4}
                                                value={formData.cvv}
                                                onChange={(e) =>
                                                    handleInputChange(e, "cvv")
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                                    >
                                        Place Order
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4">
                                    Order Summary
                                </h2>
                                <div className="space-y-4">
                                    {items.map((cartItem) => (
                                        <div
                                            key={cartItem.item.id}
                                            className="flex items-center gap-4"
                                        >
                                            <img
                                                src={cartItem.item.images[0]}
                                                alt={cartItem.item.title}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-medium">
                                                    {cartItem.item.title}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Quantity:{" "}
                                                    {cartItem.quantity}
                                                </p>
                                            </div>
                                            <p className="font-semibold">
                                                $
                                                {(
                                                    cartItem.item.price *
                                                    cartItem.quantity
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t mt-4 pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
