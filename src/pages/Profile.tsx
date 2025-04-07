import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  Settings,
  Star,
  LogOut,
  VerifiedIcon,
  User,
  Clock,
} from "lucide-react";
import { mockListings } from "@/models/Marketplace";
import { mockServices } from "@/models/Service";

export default function Profile() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Filter listings and services for this user
  const userListings = mockListings.filter(
    (item) => item.sellerId === currentUser?.user_id
  );
  const userServices = mockServices.filter(
    (service) => service.providerId === currentUser?.user_id
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Calculate account age
  const accountAge = () => {
    if (!currentUser?.joinedAt) return "N/A";

    const now = new Date();
    const joinDate = new Date(currentUser.joinedAt);
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} ${diffMonths === 1 ? "month" : "months"}`;
    }
  };

  return (
    <AppLayout title="Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="tiger-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-grambling-gray flex items-center justify-center overflow-hidden">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.first_name + " " + currentUser.last_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-grambling-black/50" />
                  )}
                </div>
                {currentUser?.verified && (
                  <div className="absolute bottom-0 right-0 bg-grambling-gold text-grambling-black rounded-full p-1">
                    <VerifiedIcon className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start">
                  <h1 className="text-xl font-semibold">
                    {currentUser?.first_name + " " + currentUser?.last_name}
                  </h1>
                  {currentUser?.verified && (
                    <span className="ml-2 bg-grambling-gold/20 text-grambling-black text-xs px-2 py-1 rounded-full flex items-center">
                      <VerifiedIcon className="h-3 w-3 mr-1" />
                      Verified Student
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start mt-1">
                  <Star className="h-4 w-4 text-grambling-gold fill-grambling-gold" />
                  <span className="text-sm ml-1">
                    {currentUser?.rating || "No ratings yet"}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Member for {accountAge()}
                </div>

                {currentUser?.bio && (
                  <p className="mt-2 text-sm text-gray-600">
                    {currentUser.bio}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/profile/edit">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/messages">
            <Card className="tiger-card hover:border-grambling-gold transition-colors h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                <MessageSquare className="h-8 w-8 text-grambling-gold mb-2" />
                <span className="text-sm font-medium">Messages</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/profile/settings">
            <Card className="tiger-card hover:border-grambling-gold transition-colors h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                <Settings className="h-8 w-8 text-grambling-gold mb-2" />
                <span className="text-sm font-medium">Settings</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Listings */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">My Listings</h2>
            <Link to="/marketplace/new" className="text-grambling-gold text-sm">
              + Add New
            </Link>
          </div>

          {userListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {userListings.map((item) => (
                <Link to={`/marketplace/${item.id}`} key={item.id}>
                  <Card className="tiger-card h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square relative">
                        <img
                          src={
                            item.images[0] ||
                            "https://via.placeholder.com/300x300?text=Item"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        <div className="absolute bottom-0 left-0 bg-grambling-gold text-grambling-black px-2 py-1 rounded-tr-lg font-semibold text-sm">
                          ${item.price}
                        </div>
                        <div className="absolute top-0 right-0 bg-grambling-black text-white px-2 py-1 rounded-bl-lg text-xs">
                          {item.status}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.category}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="tiger-card bg-gray-50">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  No Listings Yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start selling items to the Grambling community
                </p>
                <Link to="/marketplace/new">
                  <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                    Create Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* My Services */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">My Services</h2>
            <Link to="/services/new" className="text-grambling-gold text-sm">
              + Add New
            </Link>
          </div>

          {userServices.length > 0 ? (
            <div className="space-y-3">
              {userServices.map((service) => (
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
                            <Star className="h-4 w-4 text-grambling-gold fill-grambling-gold" />
                            <span className="text-sm ml-1">
                              {service.rating}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({service.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${service.rate}
                            {service.rateType === "hourly" ? "/hr" : ""}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {service.category}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="tiger-card bg-gray-50">
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  No Services Yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Share your skills with the Grambling community
                </p>
                <Link to="/services/new">
                  <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                    Create Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
