import { Bell, MessageSquare, Search, User } from "lucide-react";
import { Link } from "react-router-dom";

export function AppHeader({ title }: { title: string }) {
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
          <Link to="/search" className="text-white">
            <Search className="h-6 w-6" />
          </Link>
          <Link to="/messages" className="text-white">
            <MessageSquare className="h-6 w-6" />
          </Link>
          <Link to="/notifications" className="text-white">
            <Bell className="h-6 w-6" />
          </Link>
          <Link to="/profile" className="text-white">
            <User className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
