import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
    const { items, removeFromCart, updateQuantity, totalItems, totalPrice } =
        useCart();

    if (items.length === 0) {
        return (
            <AppLayout title="Shopping Cart">
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h2 className="text-2xl font-bold mb-2">
                                Your cart is empty
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Looks like you haven't added any items to your
                                cart yet.
                            </p>
                            <Link to="/marketplace">
                                <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                                    Continue Shopping
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Shopping Cart">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((cartItem) => (
                            <Card key={cartItem.item.id}>
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <img
                                            src={cartItem.item.images[0]}
                                            alt={cartItem.item.title}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold">
                                                {cartItem.item.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                {cartItem.item.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                cartItem.item
                                                                    .id,
                                                                cartItem.quantity -
                                                                    1
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center">
                                                        {cartItem.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                cartItem.item
                                                                    .id,
                                                                cartItem.quantity +
                                                                    1
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold">
                                                        $
                                                        {(
                                                            cartItem.item
                                                                .price *
                                                            cartItem.quantity
                                                        ).toFixed(2)}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                cartItem.item.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4">
                                    Order Summary
                                </h2>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span>
                                            Subtotal ({totalItems} items)
                                        </span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Total</span>
                                            <span>
                                                ${totalPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link to="/checkout" className="block">
                                    <Button className="w-full bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
