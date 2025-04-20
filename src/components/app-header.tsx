import { Bell, MessageSquare, Search, User, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabaseCon } from "@/db_api/connection";
import { Input } from "@/components/ui/input";

export function AppHeader({ title, user }: { title: string; user: { user_id: string } }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNotification, setIsNewNotification] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousCountRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if user is logged in
    if (user?.user_id) {
      fetchUnreadCount();
      
      // Set up a timer to check for new notifications more frequently (every 10 seconds)
      const intervalId = setInterval(fetchUnreadCount, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Force a refresh when navigating to any page
  useEffect(() => {
    const handleRouteChange = () => {
      if (user?.user_id) {
        console.log("Route changed, refreshing notification count");
        setTimeout(fetchUnreadCount, 500); // Small delay to allow DB operations to complete
      }
    };

    // Add event listener for navigation
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [user]);

  // Track changes in notification count and trigger animation
  useEffect(() => {
    if (unreadCount > previousCountRef.current) {
      setIsNewNotification(true);
      
      // Reset animation after 3 seconds
      const timeoutId = setTimeout(() => {
        setIsNewNotification(false);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
    
    previousCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    // Focus the input when expanded
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Add click outside listener to collapse search when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchExpanded &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchExpanded]);

  // Listen for custom refresh event
  useEffect(() => {
    const handleRefreshRequest = () => {
      if (user?.user_id) {
        console.log("Refresh notifications event received");
        fetchUnreadCount();
      }
    };

    window.addEventListener('refreshNotifications', handleRefreshRequest);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshRequest);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user?.user_id) return;
    
    try {
      const res = await supabaseCon.getUnreadNotificationCount(user.user_id);
      if (res.success) {
        setUnreadCount(res.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setSearchQuery("");
    } else {
      navigate('/search');
      setIsSearchExpanded(false);
    }
  };

  return (
    <header className="bg-grambling-black text-white p-4 sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center">
            <img
              src="/src/images/logo.png"
              alt="Tiger Life"
              className="h-8 w-8 mr-2"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFD700' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 5.172C10 3.782 8.423 2.93 7.172 3.757c-1.287.85-2.993.39-3.793-1.026A7.473 7.473 0 0 0 1 6.446c0 2.9 1.644 5.464 4.5 6.797 1.384.646 2.584 1.517 3.544 2.553C10.161 16.98 11.166 18 13 18s2.839-1.02 3.956-2.204c.96-1.036 2.16-1.907 3.544-2.553C23.356 11.91 25 9.346 25 6.446a7.473 7.473 0 0 0-2.38-5.48c-.799 1.417-2.506 1.877-3.793 1.027C17.577 1.166 16 2.018 16 3.172V11h-2V7.5h-2V11h-2V5.172z'/%3E%3C/svg%3E";
              }}
            />
            <span className="text-lg font-bold">{title}</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {isSearchExpanded ? (
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                className="w-64 pr-8 text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="button" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsSearchExpanded(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button onClick={handleSearchClick}>
              <Search className="h-6 w-6" />
            </button>
          )}
          <Link to={`/messages`}>
            <MessageSquare className="h-6 w-6" />
          </Link>
          <Link to="/notifications" className="text-white relative">
            <Bell className={`h-6 w-6 ${isNewNotification ? 'animate-pulse text-grambling-gold' : ''}`} />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center ${isNewNotification ? 'ring-2 ring-grambling-gold' : ''}`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile" className="text-white">
            <User className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
