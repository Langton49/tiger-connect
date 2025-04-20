import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle2, ShoppingBag } from "lucide-react";

export default function OrderSuccess() {
    return (
        <AppLayout title="Order Confirmed">
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-8 text-center">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <h1 className="text-3xl font-bold mb-4">
                            Order Confirmed!
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Thank you for your purchase. Your order has been
                            successfully placed and will be processed soon.
                        </p>
                        <div className="space-x-4">
                            <Link to="/marketplace">
                                <Button
                                    variant="outline"
                                    className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black"
                                >
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
