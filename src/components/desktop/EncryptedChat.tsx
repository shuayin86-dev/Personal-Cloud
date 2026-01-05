import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Send, FileUp, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encryptedChatService, EncryptedMessage } from "@/lib/encrypted-chat-service";

export const EncryptedChat = ({ userId, username }: { userId: string; username: string }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    initializeEncryption();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadConversation(selectedConversation);
    }
  }, [selectedConversation]);

  const initializeEncryption = async () => {
    try {
      const key = await encryptedChatService.generateEncryptionKey();
      setEncryptionKey(key);
    } catch (error) {
      console.error("Error initializing encryption:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = encryptedChatService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadConversation = async (otherUserId: string) => {
    try {
      setLoading(true);
      const conv = await encryptedChatService.getConversation(otherUserId);
      setMessages(conv);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !encryptionKey) return;

    try {
      if (!selectedConversation) {
        alert("Please select a conversation");
        return;
      }

      const message = await encryptedChatService.sendEncryptedMessage(
        selectedConversation,
        "User",
        messageText,
        encryptionKey
      );

      setMessages([...messages, message]);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const decryptMessage = async (encryptedMsg: EncryptedMessage): Promise<string> => {
    try {
      if (!encryptionKey) return "[Unable to decrypt]";
      return await encryptedChatService.decryptMessage(
        encryptedMsg.encryptedContent,
        encryptionKey
      );
    } catch (error) {
      return "[Decryption failed]";
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-background to-card/50">
      {/* Sidebar - Conversations */}
      <div className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5" /> Messages
          </h2>
          <Input placeholder="Search conversations..." />
        </div>

        <div className="flex-1 overflow-auto">
          {conversations.map((conv) => (
            <motion.button
              key={conv.userId}
              onClick={() => setSelectedConversation(conv.userId)}
              whileHover={{ backgroundColor: "var(--color-accent)" }}
              className={`w-full text-left p-3 border-b border-border transition-colors ${
                selectedConversation === conv.userId
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <p className="font-semibold">{conv.userName}</p>
              <p className="text-xs text-muted-foreground">
                {conv.unreadCount > 0 && `${conv.unreadCount} unread`}
              </p>
            </motion.button>
          ))}
        </div>

        <Button className="m-3 w-[calc(100%-24px)]">
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground pt-8">No messages yet</div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === userId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <p className="text-sm break-words">
                        {msg.encryptedContent.substring(0, 50)}...
                      </p>
                      {msg.attachmentName && (
                        <p className="text-xs mt-1 flex items-center gap-1">
                          <FileUp className="w-3 h-3" /> {msg.attachmentName}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Type encrypted message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> End-to-end encrypted
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a conversation to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
