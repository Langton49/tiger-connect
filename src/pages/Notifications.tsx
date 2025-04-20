import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { AppLayout } from "@/components/app-layout";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  Tag, 
  RefreshCw, 
  Bell,
  CheckCircle2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

// Notification type icons
const notificationIcons = {
  message: <MessageCircle className="h-5 w-5" />,
  listing: <Tag className="h-5 w-5" />,
  service: <Calendar className="h-5 w-5" />,
  purchase: <ShoppingCart className="h-5 w-5" />,
  sale: <DollarSign className="h-5 w-5" />,
  booking: <Calendar className="h-5 w-5" />,
  default: <Bell className="h-5 w-5" />
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async () => {
    if (!currentUser?.user_id) {
      setLoading(false);
      return;
    }
    
    setRefreshing(true);
    
    try {
      const res = await supabaseCon.getNotifications(currentUser.user_id);
      
      if (res.success) {
        setNotifications(res.data || []);
      } else {
        console.error("Failed to fetch notifications:", res.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser?.user_id) return;
    
    try {
      const res = await supabaseCon.markNotificationRead(notificationId);
      
      if (res.success) {
        // Update the local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser?.user_id || notifications.length === 0) return;
    
    try {
      // Mark each unread notification as read
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await supabaseCon.markNotificationRead(notification.id);
      }
      
      // Update all notifications in the state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  // Get the icon for a notification type
  const getIcon = (type) => {
    return notificationIcons[type] || notificationIcons.default;
  };

  // Get the link for a notification based on its type and related_id
  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "message":
        return `/messages/${notification.related_id}`;
      case "listing":
        return `/product/${notification.related_id}`;
      case "service":
        return `/services/${notification.related_id}`;
      case "purchase":
      case "sale":
        return `/order-success?id=${notification.related_id}`;
      case "booking":
        return `/services`;
      default:
        return "#";
    }
  };

  // Initial fetch
  useEffect(() => {
    if (currentUser?.user_id) {
      fetchNotifications();
    }
  }, [currentUser]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!currentUser?.user_id) return;
    
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <AppLayout title="Notifications">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Notifications</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={!notifications.some(n => !n.read)}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark all as read</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchNotifications} 
              disabled={refreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="listing">Listings</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
            <TabsTrigger value="purchase">Purchases</TabsTrigger>
            <TabsTrigger value="sale">Sales</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <p>Loading notifications...</p>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <Bell className="h-12 w-12 mx-auto mb-4 text-grambling-gold/40" />
                <p className="text-lg font-semibold">No notifications yet</p>
                <p className="text-sm">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Link 
                    to={getNotificationLink(notification)}
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <Card className={`hover:shadow-sm transition-shadow ${!notification.read ? 'border-grambling-gold bg-yellow-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-full ${!notification.read ? 'bg-grambling-gold/20' : 'bg-gray-100'}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{notification.title}</h3>
                              <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 