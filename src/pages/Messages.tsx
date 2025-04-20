import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { receiverId } = useParams(); // 🧠 from the URL
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const [receiverInfo, setReceiverInfo] = useState(null);

  const fetchMessages = async () => {
    if (!receiverId || !currentUser?.user_id) {
      setLoading(false);
      return;
    }
    
    setRefreshing(true);
    console.log("Fetching messages between", currentUser.user_id, "and", receiverId);
    
    try {
      const res = await supabaseCon.getMessages(currentUser.user_id, receiverId);
      if (res.success) {
        setMessages(res.messages || []);
      } else {
        console.error("Failed to fetch messages:", res.error);
      }
      
      // Get receiver info if not already loaded
      if (!receiverInfo) {
        fetchReceiverInfo();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReceiverInfo = async () => {
    try {
      // Make a query to get basic information about the receiver
      const { data, error } = await supabaseCon.supabase
        .from("user_table")
        .select("first_name, last_name")
        .eq("user_id", receiverId)
        .single();
      
      if (error) {
        console.error("Error fetching receiver info:", error);
      } else if (data) {
        setReceiverInfo(data);
      }
    } catch (error) {
      console.error("Error in fetchReceiverInfo:", error);
    }
  };

  // Scroll to bottom of messages when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load
  useEffect(() => {
    if (receiverId) {
      fetchMessages();
      fetchReceiverInfo();
    }
  }, [receiverId, currentUser]);

  // Polling for new messages
  useEffect(() => {
    if (!receiverId || !currentUser?.user_id) return;
    
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [receiverId, currentUser]);

  const handleSend = async () => {
    if (!messageText.trim() || !receiverId) {
      console.warn("Cannot send message: empty message or missing receiver ID");
      return;
    }
    
    if (!currentUser?.user_id) {
      console.error("Cannot send message: User not authenticated");
      alert("You must be logged in to send messages");
      return;
    }
    
    console.log("SENDING MESSAGE", {
      sender: currentUser.user_id,
      receiver: receiverId,
      content: messageText,
    });
    
    try {
      const receiver = String(receiverId);
      const res = await supabaseCon.sendMessage(currentUser.user_id, receiver, messageText);
      
      if (res.success) {
        console.log("Message sent successfully");
        setMessageText("");
        await fetchMessages(); // Use await to ensure messages are fetched before updating UI
      } else {
        console.error("Failed to send message:", res.error);
        alert("Message failed to send: " + res.error);
      }
    } catch (err) {
      console.error("Exception when sending message:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  // Handle Enter key to send message
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* 🔙 Back Button and Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="cursor-pointer text-grambling-gold hover:text-grambling-gold/80"
            onClick={() => navigate(-1)}
          />
          <h2 className="text-xl font-semibold">
            {receiverInfo ? `${receiverInfo.first_name} ${receiverInfo.last_name}` : "Messages"}
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchMessages} 
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 🧾 Message List */}
      <div className="border rounded p-4 h-[400px] overflow-y-auto bg-gray-50">
        {loading ? (
          <p className="text-center text-gray-400 mt-20">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 ${
                  msg.sender_id === currentUser?.user_id
                    ? "text-right"
                    : "text-left"
                }`}
              >
                <div 
                  className={`inline-block max-w-[80%] rounded-lg p-3 ${
                    msg.sender_id === currentUser?.user_id
                      ? "bg-yellow-100"
                      : "bg-white border"
                  }`}
                >
                  <div className="text-sm mb-1">{msg.content}</div>
                  <div className="text-xs text-gray-500">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ✍️ Message Input */}
      <div className="flex mt-4 gap-2">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 border px-4 py-2 rounded resize-none h-[60px]"
          disabled={loading || !receiverId}
        />
        <button
          onClick={handleSend}
          className="bg-grambling-gold text-black px-4 py-2 rounded h-[60px]"
          disabled={loading || !messageText.trim() || !receiverId}
        >
          Send
        </button>
      </div>
    </div>
  );
}