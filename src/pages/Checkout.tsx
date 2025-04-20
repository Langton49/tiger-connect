import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createClient } from "@supabase/supabase-js";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    cardName: string;
}

export default function Checkout() {
    const stripe = useStripe();
    const elements = useElements();
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        cardName: "",
    });

    const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_KEY
    );

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

        if (!stripe || !elements) {
            toast({
                title: "Stripe not initialized",
                description: "Please wait while we load payment processing",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            const { data: paymentIntentData, error: intentError } =
                await supabase.functions.invoke("create-payment-intent", {
                    body: JSON.stringify({
                        amount: Math.round(totalPrice * 100),
                        metadata: {
                            customer_name: `${formData.firstName} ${formData.lastName}`,
                            customer_email: formData.email,
                            shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                            items: JSON.stringify(
                                items.map((item) => ({
                                    id: item.item.id,
                                    seller_stripe_id:
                                        item.item.seller_stripe_id,
                                    quantity: item.quantity,
                                    totalPrice: item.item.price * item.quantity,
                                }))
                            ),
                        },
                    }),
                });

            if (intentError || !paymentIntentData?.clientSecret) {
                throw new Error(
                    intentError?.message || "Failed to create payment intent"
                );
            }

            const { error: confirmError, paymentIntent } =
                await stripe.confirmCardPayment(
                    paymentIntentData.clientSecret,
                    {
                        payment_method: {
                            card: elements.getElement(CardElement)!,
                            billing_details: {
                                name: formData.cardName,
                                email: formData.email,
                                address: {
                                    line1: formData.address,
                                    city: formData.city,
                                    state: formData.state,
                                    postal_code: formData.zipCode,
                                    country: "US",
                                },
                            },
                        },
                    }
                );

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent?.status === "succeeded") {
                const { data: userData } = await supabase.auth.getUser();
                const customerId = userData.user?.id || null;

                const { error: orderError } = await supabase
                    .from("orders")
                    .insert({
                        payment_intent_id: paymentIntent.id,
                        amount: totalPrice,
                        status: "processing",
                        user_id: customerId,
                        items: items.map((item) => ({
                            product_id: item.item.id,
                            seller_id: item.item.seller_id,
                            quantity: item.quantity,
                            price: item.item.price,
                        })),
                    });

                if (orderError) {
                    console.error("Order creation error:", orderError);
                    throw new Error("Failed to create order");
                }

                await supabase.functions.invoke("process-seller-payouts", {
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                    }),
                });

                clearCart();
                toast({
                    title: "Payment succeeded!",
                    description: "Thank you for your purchase.",
                });
                navigate("/order-success", {
                    state: {
                        paymentId: paymentIntent.id,
                        amount: totalPrice,
                    },
                });
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

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
                                        <Label>Card Details</Label>
                                        <div className="border rounded-md p-2">
                                            <CardElement
                                                options={{
                                                    style: {
                                                        base: {
                                                            fontSize: "16px",
                                                            color: "#424770",
                                                            "::placeholder": {
                                                                color: "#aab7c4",
                                                            },
                                                        },
                                                        invalid: {
                                                            color: "#9e2146",
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
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

                                    <Button
                                        type="submit"
                                        className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                                        disabled={!stripe || isProcessing}
                                    >
                                        {isProcessing
                                            ? "Processing..."
                                            : "Place Order"}
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
