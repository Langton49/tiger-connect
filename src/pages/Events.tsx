import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
    Filter,
    Search,
    CalendarDays,
    Clock,
    MapPin,
    Users,
} from "lucide-react";
import { mockEvents, eventCategories, Event } from "@/models/Event";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function Events() {
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [showStudentOnly, setShowStudentOnly] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<string>("upcoming");
    const [filteredEvents, setFilteredEvents] = useState<Event[]>(mockEvents);

    // Format date for display
    const formatEventDate = (startDate: Date, endDate: Date) => {
        if (startDate.toDateString() === endDate.toDateString()) {
            return new Date(startDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        } else {
            return `${new Date(startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })} - ${new Date(endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })}`;
        }
    };

    // Format time for display
    const formatEventTime = (date: Date) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    useEffect(() => {
        let filtered = [...mockEvents];

        // Apply search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title.toLowerCase().includes(query) ||
                    event.description.toLowerCase().includes(query) ||
                    event.location.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(
                (event) => event.category === selectedCategory
            );
        }

        // Apply date filter
        const now = new Date();
        if (dateFilter === "today") {
            filtered = filtered.filter(
                (event) =>
                    event.startDate.toDateString() === now.toDateString() ||
                    (event.startDate <= now && event.endDate >= now)
            );
        } else if (dateFilter === "this_week") {
            const weekFromNow = new Date(now);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            filtered = filtered.filter(
                (event) =>
                    event.startDate >= now && event.startDate <= weekFromNow
            );
        } else if (dateFilter === "this_month") {
            const monthFromNow = new Date(now);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            filtered = filtered.filter(
                (event) =>
                    event.startDate >= now && event.startDate <= monthFromNow
            );
        }

        // Apply student only filter
        if (showStudentOnly) {
            filtered = filtered.filter((event) => event.studentOnly);
        }

        // Apply sorting
        if (sortBy === "upcoming") {
            filtered.sort(
                (a, b) => a.startDate.getTime() - b.startDate.getTime()
            );
        } else if (sortBy === "popularity") {
            filtered.sort((a, b) => b.attendeeCount - a.attendeeCount);
        }

        setFilteredEvents(filtered);
    }, [searchQuery, selectedCategory, dateFilter, showStudentOnly, sortBy]);

    const resetFilters = () => {
        setSelectedCategory("");
        setDateFilter("all");
        setShowStudentOnly(false);
    };

    return (
        <AppLayout title="Events">
            <div className="space-y-4">
                {/* Search and Sort Bar */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 tiger-input"
                        />
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filter Events</SheetTitle>
                                <SheetDescription>
                                    Find events that interest you
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Category
                                    </label>
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={setSelectedCategory}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                All Categories
                                            </SelectItem>
                                            {eventCategories.map((category) => (
                                                <SelectItem
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Date
                                    </label>
                                    <Select
                                        value={dateFilter}
                                        onValueChange={setDateFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Any Time
                                            </SelectItem>
                                            <SelectItem value="today">
                                                Today
                                            </SelectItem>
                                            <SelectItem value="this_week">
                                                This Week
                                            </SelectItem>
                                            <SelectItem value="this_month">
                                                This Month
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="student-only"
                                        checked={showStudentOnly}
                                        onChange={(e) =>
                                            setShowStudentOnly(e.target.checked)
                                        }
                                        className="rounded border-grambling-gold text-grambling-gold focus:ring-grambling-gold"
                                    />
                                    <label
                                        htmlFor="student-only"
                                        className="text-sm font-medium"
                                    >
                                        Student-Only Events
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Sort By
                                    </label>
                                    <Select
                                        value={sortBy}
                                        onValueChange={setSortBy}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Upcoming" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="upcoming">
                                                Upcoming
                                            </SelectItem>
                                            <SelectItem value="popularity">
                                                Most Popular
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <SheetFooter className="flex-row justify-between sm:justify-between space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                >
                                    Reset Filters
                                </Button>
                                <SheetClose asChild>
                                    <Button className="bg-grambling-gold hover:bg-grambling-gold/90 text-grambling-black">
                                        Apply Filters
                                    </Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Active Filters Display */}
                {(selectedCategory ||
                    dateFilter !== "all" ||
                    showStudentOnly) && (
                    <div className="flex flex-wrap gap-2">
                        {selectedCategory && (
                            <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                                {selectedCategory}
                                <button
                                    onClick={() => setSelectedCategory("")}
                                    className="ml-1 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {dateFilter !== "all" && (
                            <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                                {dateFilter === "today"
                                    ? "Today"
                                    : dateFilter === "this_week"
                                    ? "This Week"
                                    : "This Month"}
                                <button
                                    onClick={() => setDateFilter("all")}
                                    className="ml-1 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {showStudentOnly && (
                            <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                                Student Only
                                <button
                                    onClick={() => setShowStudentOnly(false)}
                                    className="ml-1 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <button
                            onClick={resetFilters}
                            className="text-xs text-grambling-gold hover:underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Events */}
                <div className="space-y-4 mb-8">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                            <Link to={`/events/${event.id}`} key={event.id}>
                                <Card className="tiger-card mb-8">
                                    <CardContent className="p-0">
                                        <div className="md:flex">
                                            <div className="md:w-1/3">
                                                <img
                                                    src={
                                                        event.image ||
                                                        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fclutchpoints.com%2Falabama-am-spoils-grambling-states-homecoming-celebration-45-24&psig=AOvVaw0LOMn7Ky0oNktCaU-Fu382&ust=1743660041282000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCKi2t9XWuIwDFQAAAAAdAAAAABAE"
                                                    }
                                                    alt={event.title}
                                                    className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-tr-none md:rounded-l-lg"
                                                />
                                            </div>
                                            <div className="p-4 md:w-2/3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-lg">
                                                        {event.title}
                                                    </h3>
                                                    {event.studentOnly && (
                                                        <span className="bg-grambling-black text-white text-xs px-2 py-1 rounded">
                                                            Students Only
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                    {event.description}
                                                </p>

                                                <div className="mt-3 space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <CalendarDays className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {formatEventDate(
                                                            event.startDate,
                                                            event.endDate
                                                        )}
                                                    </div>

                                                    <div className="flex items-center text-sm">
                                                        <Clock className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {formatEventTime(
                                                            event.startDate
                                                        )}
                                                        {event.startDate.toDateString() !==
                                                            event.endDate.toDateString() &&
                                                            ` - ${formatEventTime(
                                                                event.endDate
                                                            )}`}
                                                    </div>

                                                    <div className="flex items-center text-sm">
                                                        <MapPin className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {event.location}
                                                    </div>

                                                    <div className="flex items-center text-sm">
                                                        <Users className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {event.attendeeCount}{" "}
                                                        attending
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex">
                                                    <span className="bg-grambling-gold/20 text-grambling-black text-xs px-2 py-1 rounded-full">
                                                        {event.category}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500 flex items-center">
                                                        Organized by{" "}
                                                        {event.organizer}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-500">
                                No events match your search criteria
                            </p>
                            <Button
                                variant="link"
                                onClick={resetFilters}
                                className="text-grambling-gold mt-2"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
