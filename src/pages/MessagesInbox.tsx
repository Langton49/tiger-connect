import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesInbox() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [error, setError] = useState(null);

    const fetchConversations = async () => {
    if (!currentUser?.user_id) {
      console.log("No current user ID, not fetching conversations");
      setLoading(false);
      return;
    }
    
    setRefreshing(true);
    console.log("🔄 Fetching conversations for user:", currentUser.user_id);
    
    try {
      // Fetch all users for testing - DEBUG MODE
      const usersRes = await supabaseCon.getUsers();
      console.log("👥 All users:", usersRes);
      
      // Get conversations the normal way
      const res = await supabaseCon.getConversations(currentUser.user_id);
      console.log("💬 Conversations response:", res);
      
      if (res.success) {
        if (res.data && res.data.length > 0) {
          console.log("✅ Found conversations:", res.data.length);
        setConversations(res.data);
          
          // Fetch last messages for each conversation
          const lastMsgs = {};
          for (const user of res.data) {
            console.log("🔍 Fetching messages with user:", user.user_id);
            const msgRes = await supabaseCon.getMessages(currentUser.user_id, user.user_id);
            console.log("📩 Message response:", msgRes);
            
            if (msgRes.success && msgRes.messages && msgRes.messages.length > 0) {
              // Get the most recent message
              const recentMessage = msgRes.messages[msgRes.messages.length - 1];
              console.log("📄 Most recent message:", recentMessage);
              
              lastMsgs[user.user_id] = {
                content: recentMessage.content,
                timestamp: new Date(recentMessage.created_at),
                isFromMe: recentMessage.sender_id === currentUser.user_id
              };
            } else {
              console.log("⚠️ No messages found with user:", user.user_id);
            }
          }
          setLastMessages(lastMsgs);
        } else {
          console.log("ℹ️ No conversations found");
        }
      } else {
        console.error("❌ Failed to fetch conversations:", res.error);
        setError(res.error);
      }
      
      // FALLBACK: If no conversations found, get all messages directly
      if (!res.success || !res.data || res.data.length === 0) {
        console.log("🔄 No conversations found, checking direct messages...");
        
        // First try to get all messages for this user as sender
        const { data: sentMessages, error: sentError } = await supabaseCon.supabase
          .from("Messages")
          .select("*, receiver:receiver_id(*)")
          .eq("sender_id", currentUser.user_id);
        
        console.log("📤 Sent messages response:", { data: sentMessages, error: sentError });
        
        // Then get all messages for this user as receiver
        const { data: receivedMessages, error: receivedError } = await supabaseCon.supabase
          .from("Messages")
          .select("*, sender:sender_id(*)")
          .eq("receiver_id", currentUser.user_id);
        
        console.log("📥 Received messages response:", { data: receivedMessages, error: receivedError });
        
        // Combine partners into a unique list
        const conversationPartners = new Map();
        
        // Add recipients from sent messages
        if (sentMessages && sentMessages.length > 0) {
          sentMessages.forEach(msg => {
            if (msg.receiver && !conversationPartners.has(msg.receiver_id)) {
              conversationPartners.set(msg.receiver_id, msg.receiver);
            }
          });
        }
        
        // Add senders from received messages
        if (receivedMessages && receivedMessages.length > 0) {
          receivedMessages.forEach(msg => {
            if (msg.sender && !conversationPartners.has(msg.sender_id)) {
              conversationPartners.set(msg.sender_id, msg.sender);
            }
          });
        }
        
        // Convert to array for state
        const partnersList = Array.from(conversationPartners.values());
        console.log("🔄 Fallback conversation partners:", partnersList);
        
        if (partnersList.length > 0) {
          setConversations(partnersList);
          
          // Get last messages
          const lastMsgs = {};
          const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
          
          // Group by conversation partner
          const msgsByPartner = new Map();
          
          allMessages.forEach(msg => {
            const partnerId = msg.sender_id === currentUser.user_id ? msg.receiver_id : msg.sender_id;
            
            if (!msgsByPartner.has(partnerId)) {
              msgsByPartner.set(partnerId, []);
            }
            
            msgsByPartner.get(partnerId).push(msg);
          });
          
          // Find most recent message for each partner
          msgsByPartner.forEach((messages, partnerId) => {
            // Sort by created_at date
            messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const recentMessage = messages[messages.length - 1];
            
            lastMsgs[partnerId] = {
              content: recentMessage.content,
              timestamp: new Date(recentMessage.created_at),
              isFromMe: recentMessage.sender_id === currentUser.user_id
            };
          });
          
          setLastMessages(lastMsgs);
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error in fetchConversations:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (currentUser?.user_id) {
      console.log("👤 Current user detected, initiating fetch:", currentUser);
      fetchConversations();
    }
  }, [currentUser]);

  // Setup real-time updates - poll every 20 seconds
  useEffect(() => {
    if (!currentUser?.user_id) return;
    
    console.log("⏱️ Setting up polling for conversations");
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 20000);
    
    return () => {
      console.log("🛑 Cleaning up polling interval");
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Add a diagnostic check for the Messages table
  useEffect(() => {
    const checkMessagesTable = async () => {
      try {
        // Try to get the structure of the Messages table
        const { data, error } = await supabaseCon.supabase
          .from('Messages')
          .select('*')
          .limit(1);
          
        console.log("📋 Messages table diagnostic check:", { data, error });
        
        // If there's no error but the data is empty, try to insert a test message
        if (!error && (!data || data.length === 0) && currentUser?.user_id) {
          console.log("🧪 No messages found. Trying to insert a test message...");
          
          const testResult = await supabaseCon.sendMessage(
            currentUser.user_id,
            currentUser.user_id,  // Send to self as test
            "Test message - please ignore"
          );
          
          console.log("🧪 Test message result:", testResult);
        }
      } catch (err) {
        console.error("❌ Error checking Messages table:", err);
      }
    };
    
    if (currentUser?.user_id) {
      checkMessagesTable();
    }
  }, [currentUser]);

  // Format timestamp to a readable format
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AppLayout title="Messages">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Messages</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchConversations} 
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-md">
            <p className="font-semibold">Error loading conversations:</p>
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <p>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-grambling-gold/40" />
            <p className="text-lg font-semibold">You don't have any active conversations yet.</p>
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
                <Card className="hover:border-grambling-gold transition-colors hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                    <h2 className="text-lg font-medium">
                      {user.first_name} {user.last_name}
                    </h2>
                        {lastMessages[user.user_id] && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {lastMessages[user.user_id].isFromMe && <span className="text-xs font-medium text-gray-400 mr-1">You:</span>}
                            {lastMessages[user.user_id].content}
                          </p>
                        )}
                      </div>
                      {lastMessages[user.user_id] && (
                        <span className="text-xs text-gray-400">
                          {formatTime(lastMessages[user.user_id].timestamp)}
                        </span>
                      )}
                    </div>
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
