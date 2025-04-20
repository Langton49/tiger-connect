import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function MessagesInbox() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.user_id) return;
      const res = await supabaseCon.getConversations(currentUser.user_id);
      if (res.success) {
        setConversations(res.data);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [currentUser]);

  return (
    <AppLayout title="Messages">
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Your Messages</h1>
        {loading ? (
          <p>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p className="text-lg font-semibold">You don’t have any active conversations yet.</p>
            <p className="text-sm">Start chatting with other students by visiting a listing or service and clicking the message icon.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((user) => (
              <Link
                to={`/messages/${user.user_id}`}
                key={user.user_id}
                className="block"
              >
                <Card className="hover:border-grambling-gold transition-colors">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-medium">
                      {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
