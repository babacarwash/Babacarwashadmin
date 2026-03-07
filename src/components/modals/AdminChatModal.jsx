import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  MessageCircle,
  Loader2,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminMessagesService } from "../../api/adminMessagesService";

const AdminChatModal = ({ isOpen, onClose, staff, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const currentUserIsAdmin =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!staff?._id) return;

    try {
      setLoading(true);
      const response = await adminMessagesService.getConversation(staff._id);
      setMessages(response.data || []);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read when opening chat
  const markMessagesAsRead = async () => {
    if (!staff?._id) return;

    try {
      await adminMessagesService.markAsRead(staff._id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !staff?._id) return;

    setSending(true);
    try {
      await adminMessagesService.sendMessage({
        staffId: staff._id,
        message: newMessage.trim(),
      });

      setNewMessage("");
      await fetchMessages();
      inputRef.current?.focus();
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await adminMessagesService.deleteMessage(messageId);
      toast.success("Message deleted");
      await fetchMessages();
    } catch (error) {
      toast.error(error.message || "Failed to delete message");
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (isOpen && staff?._id) {
      fetchMessages();
      markMessagesAsRead();

      pollIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isOpen, staff?._id]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageSender = (message) => {
    const isCurrentUser = message.senderId?._id === currentUser?._id;
    const senderName =
      message.senderId?.name ||
      message.senderId?.firstName ||
      (currentUserIsAdmin ? "Admin" : staff?.name || "Staff");

    return { isCurrentUser, senderName };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                {staff?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {staff?.name || "Staff Member"}
                </h3>
                <p className="text-xs text-white/80">{staff?.number || ""}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const { isCurrentUser, senderName } =
                    getMessageSender(message);

                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`group relative max-w-[70%] rounded-2xl px-4 py-2 ${
                          isCurrentUser
                            ? "bg-indigo-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-bl-sm"
                        }`}
                      >
                        {!isCurrentUser && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {senderName}
                          </p>
                        )}
                        <p className="text-sm break-words">{message.message}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span
                            className={`text-[10px] ${
                              isCurrentUser ? "text-white/70" : "text-slate-400"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {isCurrentUser && (
                            <>
                              {message.isRead ? (
                                <CheckCheck className="w-3 h-3 text-white/70" />
                              ) : (
                                <Check className="w-3 h-3 text-white/70" />
                              )}
                            </>
                          )}
                        </div>

                        {/* Delete button (only for own messages) */}
                        {isCurrentUser && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminChatModal;
