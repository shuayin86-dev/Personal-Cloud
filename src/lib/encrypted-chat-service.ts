import { supabase } from "@/integrations/supabase/client";

export interface EncryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  encryptedContent: string;
  encryptionKey: string;
  timestamp: Date;
  isRead: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface EncryptedConversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  messages: EncryptedMessage[];
  lastMessage?: EncryptedMessage;
  createdAt: Date;
  updatedAt: Date;
}

export class EncryptedChatService {
  /**
   * Generate encryption key using Web Crypto API
   */
  async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypt message content
   */
  async encryptMessage(message: string, key: CryptoKey): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error("Error encrypting message:", error);
      throw error;
    }
  }

  /**
   * Decrypt message content
   */
  async decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
    try {
      // Decode from base64
      const binaryString = atob(encryptedMessage);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const iv = bytes.slice(0, 12);
      const encryptedData = bytes.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Error decrypting message:", error);
      throw error;
    }
  }

  /**
   * Send encrypted message
   */
  async sendEncryptedMessage(
    senderId: string,
    senderName: string,
    recipientId: string,
    message: string,
    key: CryptoKey,
    attachmentUrl?: string,
    attachmentName?: string
  ): Promise<EncryptedMessage> {
    try {
      // Encrypt the message
      const encryptedContent = await this.encryptMessage(message, key);

      // Store encrypted message in database
      const { data, error } = await supabase
        .from("encrypted_messages")
        .insert({
          sender_id: senderId,
          sender_name: senderName,
          recipient_id: recipientId,
          encrypted_content: encryptedContent,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        recipientId: data.recipient_id,
        encryptedContent: data.encrypted_content,
        encryptionKey: "", // Don't return key
        timestamp: new Date(data.created_at),
        isRead: data.is_read,
        attachmentUrl: data.attachment_url,
        attachmentName: data.attachment_name,
      };
    } catch (error) {
      console.error("Error sending encrypted message:", error);
      throw error;
    }
  }

  /**
   * Get encrypted conversation
   */
  async getConversation(userId: string, otherUserId: string): Promise<EncryptedConversation> {
    try {
      const { data, error } = await supabase
        .from("encrypted_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messages = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        recipientId: msg.recipient_id,
        encryptedContent: msg.encrypted_content,
        encryptionKey: "",
        timestamp: new Date(msg.created_at),
        isRead: msg.is_read,
        attachmentUrl: msg.attachment_url,
        attachmentName: msg.attachment_name,
      }));

      return {
        id: `conv_${userId}_${otherUserId}`,
        participantIds: [userId, otherUserId],
        participantNames: ["User1", "User2"], // Get from user data
        messages,
        lastMessage: messages[messages.length - 1],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error fetching conversation:", error);
      throw error;
    }
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(userId: string): Promise<EncryptedMessage[]> {
    try {
      const { data, error } = await supabase
        .from("encrypted_messages")
        .select("*")
        .eq("recipient_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        recipientId: msg.recipient_id,
        encryptedContent: msg.encrypted_content,
        encryptionKey: "",
        timestamp: new Date(msg.created_at),
        isRead: msg.is_read,
        attachmentUrl: msg.attachment_url,
        attachmentName: msg.attachment_name,
      }));
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("encrypted_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }

  /**
   * Upload file for encrypted transfer
   */
  async uploadEncryptedFile(
    file: File,
    userId: string,
    key: CryptoKey
  ): Promise<{ url: string; encrypted: true }> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Encrypt file content
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        arrayBuffer
      );

      // Upload to storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const encryptedBlob = new Blob([iv, encryptedData]);

      const { error } = await supabase.storage
        .from("encrypted-files")
        .upload(fileName, encryptedBlob);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("encrypted-files").getPublicUrl(fileName);

      return { url: publicUrl, encrypted: true };
    } catch (error) {
      console.error("Error uploading encrypted file:", error);
      throw error;
    }
  }

  /**
   * Download and decrypt file
   */
  async downloadEncryptedFile(fileUrl: string, key: CryptoKey): Promise<Blob> {
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();

      const iv = new Uint8Array(arrayBuffer.slice(0, 12));
      const encryptedData = arrayBuffer.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
      );

      return new Blob([decryptedData]);
    } catch (error) {
      console.error("Error downloading encrypted file:", error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId: string, otherUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("encrypted_messages")
        .delete()
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Get list of conversations
   */
  async getConversations(userId: string): Promise<Array<{ userId: string; userName: string; unreadCount: number }>> {
    try {
      const { data, error } = await supabase
        .from("encrypted_messages")
        .select("sender_id, sender_name, recipient_id, is_read")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      if (error) throw error;

      const conversations = new Map<string, { userName: string; unreadCount: number }>();

      (data || []).forEach((msg: any) => {
        const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const userName = msg.sender_id === userId ? msg.recipient_id : msg.sender_name;

        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, { userName, unreadCount: 0 });
        }

        if (msg.recipient_id === userId && !msg.is_read) {
          const conv = conversations.get(otherUserId)!;
          conv.unreadCount++;
        }
      });

      return Array.from(conversations.entries()).map(([userId, data]) => ({
        userId,
        userName: data.userName,
        unreadCount: data.unreadCount,
      }));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }
}

export const encryptedChatService = new EncryptedChatService();
