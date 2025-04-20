import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, Info } from "lucide-react";
import { organizationTypeNames } from "@/models/Event";

// Define interfaces for the data shapes
interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
  verified: boolean;
}

interface User {
  first_name: string;
  last_name: string;
}

interface PendingMember {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  users: User | null;
  organizations: { name: string; type: string; } | null; // Corrected type for nested organization
}

export function AdminPendingOrganizations() {
  const { currentUser } = useAuth();
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPendingOrganizations = async () => {
    setLoading(true);
    try {
      if (!currentUser || !currentUser.is_admin) {
        console.error('Current user is not available or not an admin');
        setLoading(false);
        return;
      }

      // Use the new dedicated method from supabaseCon
      const result = await supabaseCon.getPendingOrganizations(); 
        
      if (!result.success) {
        console.error('Error fetching pending organizations:', result.error);
        toast.error('Failed to fetch pending organizations');
        setPendingOrganizations([]); // Set empty array on error
      } else {
        setPendingOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('Error in fetchPendingOrganizations catch block:', error);
      toast.error('An unexpected error occurred while fetching pending organizations');
      setPendingOrganizations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrganization = async (orgId: string) => {
    if (!currentUser?.user_id) return;
    
    setApproving(orgId);
    try {
      // Ensure the method name matches the one in connection.js
      const result = await supabaseCon.approveOrganization(orgId, currentUser.user_id);
      
      if (result.success) {
        toast.success('Organization approved successfully');
        setPendingOrganizations(prev => prev.filter(org => org.id !== orgId));
      } else {
        toast.error(result.error || 'Failed to approve organization');
      }
    } catch (error) {
      console.error('Error approving organization:', error);
      toast.error('An unexpected error occurred during organization approval');
    } finally {
      setApproving(null);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.is_admin) {
      fetchPendingOrganizations();
    } else {
      // If not an admin, don't show loading, just show nothing or an appropriate message
      setLoading(false);
      setPendingOrganizations([]);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-grambling-gold" />
        <span className="ml-2 text-gray-600">Loading pending organizations...</span>
      </div>
    );
  }

  if (!currentUser?.is_admin) {
    // Optional: Show a message if the user is not a system admin
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Admin access required to view pending organizations.</p>
      </div>
    );
  }

  if (pendingOrganizations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No pending organizations to approve</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingOrganizations.map((org) => (
        <Card key={org.id} className="border-yellow-300 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{org.name}</h3>
                  <Badge variant="outline">
                    {organizationTypeNames[org.type] || org.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveOrganization(org.id)}
                  disabled={approving === org.id}
                >
                  {approving === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminPendingMembers() {
  const { currentUser } = useAuth();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [adminOrganizations, setAdminOrganizations] = useState<Organization[]>([]); // Use Organization type
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPendingMembers = async () => {
    setLoading(true);
    try {
      if (!currentUser || !currentUser.user_id) {
        console.error('Current user not available for fetching pending members');
        setLoading(false);
        return;
      }

      // Use the new dedicated method
      const result = await supabaseCon.getPendingMembersForAdmin(currentUser.user_id);

      if (!result.success) {
        console.error('Error fetching pending members:', result.error);
        toast.error('Failed to fetch pending members');
        setAdminOrganizations([]);
        setPendingMembers([]);
      } else {
        // result.data contains { adminOrganizations: [], pendingMembers: [] }
        setAdminOrganizations(result.data.adminOrganizations || []);
        setPendingMembers(result.data.pendingMembers || []);
      }
    } catch (error) {
      console.error('Error in fetchPendingMembers catch block:', error);
      toast.error('An unexpected error occurred while fetching pending members');
      setAdminOrganizations([]);
      setPendingMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMember = async (memberUserId: string, organizationId: string) => {
    if (!currentUser?.user_id) return;
    
    const approvalKey = `${memberUserId}-${organizationId}`;
    setApproving(approvalKey);
    
    try {
      // Ensure the method name matches the one in connection.js
      const result = await supabaseCon.approveOrganizationMember(
        memberUserId,
        organizationId,
        currentUser.user_id
      );
      
      if (result.success) {
        toast.success('Member approved successfully');
        setPendingMembers(prev => 
          prev.filter(member => 
            !(member.user_id === memberUserId && member.organization_id === organizationId)
          )
        );
      } else {
        toast.error(result.error || 'Failed to approve member');
      }
    } catch (error) {
      console.error('Error approving member:', error);
      toast.error('An unexpected error occurred during member approval');
    } finally {
      setApproving(null);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.user_id) {
      fetchPendingMembers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-grambling-gold" />
        <span className="ml-2 text-gray-600">Loading pending member requests...</span>
      </div>
    );
  }

  if (!loading && adminOrganizations.length === 0 && pendingMembers.length === 0) {
    // Check if the user has *any* org memberships to differentiate
    // This might require an extra check or rely on profile data if available
    // For simplicity, assume if adminOrgs is empty, they aren't an admin of anything relevant
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>You are not an admin of any organizations with pending members.</p>
      </div>
    );
  }

  if (pendingMembers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No pending member requests to approve</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingMembers.map((member) => {
        // Corrected access to nested user and organization data
        const userName = member.users ? `${member.users.first_name} ${member.users.last_name}` : 'Unknown User';
        const orgName = member.organizations ? member.organizations.name : 'Unknown Organization';
        const approvalKey = `${member.user_id}-${member.organization_id}`;
        
        return (
          <Card key={member.id} className="border-blue-300 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{userName}</h3>
                    <Badge variant="outline" className="bg-white">
                      User ID: {member.user_id.substring(0, 8)}...
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Requesting to join: <span className="font-medium">{orgName}</span>
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Requested: {new Date(member.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveMember(member.user_id, member.organization_id)} // Pass user_id
                    disabled={approving === approvalKey}
                  >
                    {approving === approvalKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 