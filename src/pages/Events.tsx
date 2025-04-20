import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import {
    Filter,
    Search,
    CalendarDays,
    Clock,
    MapPin,
    Plus,
    Calendar,
    BadgeAlert,
    Building,
    User,
} from "lucide-react";
import { 
    Event, 
    eventCategories, 
    organizationPriority, 
    organizationTypeNames 
} from "@/models/Event";
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
import { Badge } from "@/components/ui/badge";
import { supabaseCon } from "@/db_api/connection";
import { toast } from "sonner";

export default function Events() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [organizationType, setOrganizationType] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date");
    
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCanCreateEvents, setUserCanCreateEvents] = useState(false);
    const [userOrganizations, setUserOrganizations] = useState([]);

    // Format date for display
    const formatEventDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    // Format time for display
    const formatEventTime = (date: Date) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    // Get the organization type badge
    const getOrgTypeBadge = (type: string) => {
        switch(type) {
            case 'admin_faculty':
                return <Badge variant="destructive" className="text-xs">Faculty/Admin</Badge>;
            case 'official_student':
                return <Badge variant="default" className="bg-grambling-gold text-black text-xs">Official</Badge>;
            case 'general':
                return <Badge variant="outline" className="text-xs">Club</Badge>;
            default:
                return null;
        }
    };

    // Fetch events and user permissions
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all events
                const eventsData = await supabaseCon.getEvents();
                
                if (eventsData.success && eventsData.data) {
                    // Convert string dates to Date objects
                    const formattedEvents = eventsData.data.map(event => ({
                        ...event,
                        date: new Date(event.date),
                        created_at: new Date(event.created_at)
                    }));
                    
                    // Sort events by date and organization priority
                    const sortedEvents = formattedEvents.sort((a, b) => {
                        // First by date
                        const dateComp = a.date.getTime() - b.date.getTime();
                        if (dateComp !== 0) return dateComp;
                        
                        // Then by organization type priority
                        return (
                            organizationPriority[a.organization.type] - 
                            organizationPriority[b.organization.type]
                        );
                    });
                    
                    setEvents(sortedEvents);
                    setFilteredEvents(sortedEvents);
                } else {
                    console.error("Failed to fetch events:", eventsData.error);
                    toast.error("Failed to load events");
                }
                
                // Check if user can create events
                if (currentUser?.user_id) {
                    const userPermissions = await supabaseCon.canUserCreateEvents(currentUser.user_id);
                    
                    if (userPermissions.success) {
                        setUserCanCreateEvents(userPermissions.canCreate);
                        setUserOrganizations(userPermissions.organizations || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("An error occurred while loading events");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [currentUser]);

    // Filter events when filter criteria change
    useEffect(() => {
        if (!events.length) return;
        
        let filtered = [...events];

        // Apply search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title.toLowerCase().includes(query) ||
                    event.description.toLowerCase().includes(query) ||
                    event.location.toLowerCase().includes(query) ||
                    event.organization.name.toLowerCase().includes(query)
            );
        }

        // Apply organization type filter
        if (organizationType !== "all") {
            filtered = filtered.filter(
                (event) => event.organization.type === organizationType
            );
        }

        // Apply date filter
        const now = new Date();
        if (dateFilter === "today") {
            filtered = filtered.filter(
                (event) => event.date.toDateString() === now.toDateString()
            );
        } else if (dateFilter === "upcoming") {
            filtered = filtered.filter(
                (event) => event.date >= now
            );
        } else if (dateFilter === "past") {
            filtered = filtered.filter(
                (event) => event.date < now
            );
        }

        // Apply sorting
        if (sortBy === "date") {
            filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
        } else if (sortBy === "priority") {
            filtered.sort((a, b) => {
                return (
                    organizationPriority[a.organization.type] - 
                    organizationPriority[b.organization.type]
                );
            });
        }

        setFilteredEvents(filtered);
    }, [events, searchQuery, organizationType, dateFilter, sortBy]);

    const resetFilters = () => {
        setSelectedCategory("");
        setOrganizationType("all");
        setDateFilter("all");
    };

    const handleCreateEvent = () => {
        if (!currentUser) {
            toast.error("Please log in to create events");
            navigate("/login");
            return;
        }
        
        if (!userCanCreateEvents) {
            toast.error("You must be a verified member of an organization to create events");
            return;
        }
        
        navigate("/events/new");
    };

    return (
        <AppLayout title="Events">
            <div className="space-y-4">
                {/* Header with Create Button */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Campus Events</h1>
                    {userCanCreateEvents && (
                        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Event
                        </Button>
                    )}
                </div>
                
                {/* Search and Filter Bar */}
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
                                        Organization Type
                                    </label>
                                    <Select
                                        value={organizationType}
                                        onValueChange={setOrganizationType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Organizations" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Organizations
                                            </SelectItem>
                                            <SelectItem value="admin_faculty">
                                                Faculty/Admin
                                            </SelectItem>
                                            <SelectItem value="official_student">
                                                Official Student Orgs
                                            </SelectItem>
                                            <SelectItem value="general">
                                                Clubs & Groups
                                            </SelectItem>
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
                                            <SelectItem value="upcoming">
                                                Upcoming
                                            </SelectItem>
                                            <SelectItem value="past">
                                                Past Events
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                            <SelectValue placeholder="Date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">
                                                Date
                                            </SelectItem>
                                            <SelectItem value="priority">
                                                Priority
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                    >
                                        Reset Filters
                                    </Button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Button>Apply Filters</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Active Filters Display */}
                {(organizationType !== "all" || dateFilter !== "all") && (
                    <div className="flex flex-wrap gap-2">
                        {organizationType !== "all" && (
                            <div className="bg-grambling-gold/20 text-grambling-black text-xs py-1 px-2 rounded-full flex items-center">
                                {organizationTypeNames[organizationType]}
                                <button
                                    onClick={() => setOrganizationType("all")}
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
                                    : dateFilter === "upcoming"
                                    ? "Upcoming"
                                    : "Past Events"}
                                <button
                                    onClick={() => setDateFilter("all")}
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

                {/* Events Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 py-8 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-grambling-gold border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading events...</p>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                            <Link to={`/events/${event.id}`} key={event.id}>
                                <Card className="h-full hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row h-full">
                                            {event.image_url ? (
                                                <div className="md:w-1/3 h-48 md:h-auto">
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 flex items-center justify-center">
                                                    <Calendar className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}

                                            <div className="p-4 md:w-2/3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-lg">
                                                        {event.title}
                                                    </h3>
                                                    {getOrgTypeBadge(event.organization.type)}
                                                </div>

                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                    {event.description}
                                                </p>

                                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <CalendarDays className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {formatEventDate(event.date)}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {formatEventTime(event.date)}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {event.location}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <Building className="h-4 w-4 mr-2 text-grambling-gold" />
                                                        {event.organization.name}
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex">
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        Created by {event.creator.first_name} {event.creator.last_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-2 py-8 text-center">
                            <p className="text-gray-500">No events match your search criteria</p>
                            <button
                                onClick={resetFilters}
                                className="mt-2 text-grambling-gold hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
