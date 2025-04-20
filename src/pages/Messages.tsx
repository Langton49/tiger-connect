import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { receiverId } = useParams(); // 🧠 from the URL
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    if (!receiverId || !currentUser?.user_id) return;
    const res = await supabaseCon.getMessages(currentUser.user_id, receiverId);
    if (res.success) setMessages(res.messages);
  };

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


  useEffect(() => {
    if (receiverId) fetchMessages();
  }, [receiverId]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* 🔙 Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <ArrowLeft
          className="cursor-pointer text-grambling-gold hover:text-grambling-gold/80"
          onClick={() => navigate(-1)}
        />
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>

      {/* 🧾 Message List */}
      <div className="border rounded p-4 h-[400px] overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 p-2 rounded ${
                msg.sender_id === currentUser.user_id
                  ? "bg-yellow-100 text-right"
                  : "bg-white"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      {/* ✍️ Message Input */}
      <div className="flex mt-4 gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border px-4 py-2 rounded"
        />
        <button
          onClick={handleSend}
          className="bg-grambling-gold text-black px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}