import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@supabase/supabase-js";

export default function SellerOnboarding() {
  const [user, setUser] = useState(null);
  const SupabaseURL = import.meta.env.VITE_SUPABASE_URL;
  const SupabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  const supabase = createClient(SupabaseURL, SupabaseKey);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<
    "not_started" | "incomplete" | "pending" | "complete"
  >("not_started");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) {
        console.log("User not found");
        return;
      }

      const { data, error } = await supabase
        .from("user_table")
        .select("stripe_account_id, stripe_account_status")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching stripe status:", error);
        return;
      }

      console.log("Stripe status:", data?.stripe_account_status);

      if (data?.stripe_account_id) {
        setStripeStatus(data.stripe_account_status || "incomplete");
      }
    };

    checkStripeStatus();
  }, [user, supabase]);

  const handleOnboarding = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Check for existing Stripe account
      const { data: profile, error: profileError } = await supabase
        .from("user_table")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Profile lookup failed: ${profileError.message}`);
      }

      let accountId = profile?.stripe_account_id;

      // 2. Create Stripe account if needed
      if (!accountId) {
        const response = await fetch(
          `${SupabaseURL}/functions/v1/create-connected-account`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SupabaseKey}`,
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
            }),
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error || "Failed to create connected account"
          );
        }

        accountId = responseData.accountId;

        // 3. Update user record
        const { error: updateError } = await supabase
          .from("user_table")
          .update({
            stripe_account_id: accountId,
            stripe_account_status: "pending",
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw new Error(`User update failed: ${updateError.message}`);
        }
      }

      const linkResponse = await fetch(
        `${SupabaseURL}/functions/v1/create-account-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SupabaseKey}`,
          },
          body: JSON.stringify({
            accountId,
            returnUrl: `${window.location.origin}/profile`,
            refreshUrl: `${window.location.origin}/onboarding`,
          }),
        }
      );

      const linkData = await linkResponse.json();

      if (!linkResponse.ok) {
        throw new Error(linkData.error || "Failed to create account link");
      }

      // 5. Redirect to Stripe
      window.location.href = linkData.url;
    } catch (error) {
      console.error("Full onboarding error:", {
        error,
        user: user?.id,
        time: new Date().toISOString(),
      });

      toast({
        title: "Onboarding failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Become a Seller">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Seller Account Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stripeStatus === "complete" ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-4">
                  Your seller account is ready! 🎉
                </p>
                <Button
                  onClick={() => (window.location.href = "/seller-dashboard")}
                >
                  Go to Seller Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Requirements to sell:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Government-issued ID</li>
                    <li>Bank account information</li>
                    <li>Business details (if applicable)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Payout details:</h3>
                  <p className="text-sm text-gray-600">
                    Funds from sales will be deposited directly to your bank
                    account within 2 business days after purchase. Our platform
                    fee is 10% per transaction.
                  </p>
                </div>

                <Button
                  onClick={handleOnboarding}
                  disabled={loading || !user}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Set Up Payments"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
