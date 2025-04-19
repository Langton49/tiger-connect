import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseCon } from "@/db_api/connection";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [receiverId, setReceiverId] = useState(""); // temporary — you'd select this from a user/profile list
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const res = await supabaseCon.getMessages(currentUser.user_id, receiverId);
    if (res.success) setMessages(res.messages);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const res = await supabaseCon.sendMessage(currentUser.user_id, receiverId, messageText);
    if (res.success) {
      setMessageText("");
      fetchMessages(); // refresh
    }
  };

  useEffect(() => {
    if (receiverId) fetchMessages();
  }, [receiverId]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>
      <div className="border rounded p-4 h-[400px] overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-2 rounded ${
              msg.sender_id === currentUser.user_id ? "bg-yellow-100 text-right" : "bg-white"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
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
