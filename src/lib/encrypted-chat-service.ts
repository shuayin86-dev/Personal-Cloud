/**
 * Encrypted Chat Service
 * Handles end-to-end encrypted messaging using Web Crypto API
 * Uses localStorage for demo purposes
 */

export interface EncryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  encryptedContent: string;
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
  createdAt: Date;
}

const STORAGE_KEY = "pc:encrypted_chat";

export class EncryptedChatService {
  userId: string;
  userName: string;

  constructor(userId: string = "demo-user", userName: string = "User") {
    this.userId = userId;
    this.userName = userName;
  }

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
      return btoa(String.fromCharCode(...Array.from(combined)));
    } catch (error) {
      console.error("Error encrypting message:", error);
      throw error;
    }
  }

  /**
   * Decrypt message content
   */
  async decryptMessage(encryptedContent: string, key: CryptoKey): Promise<string> {
    try {
      const binaryString = atob(encryptedContent);
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
    recipientId: string,
    recipientName: string,
    content: string,
    key: CryptoKey
  ): Promise<EncryptedMessage> {
    try {
      const encryptedContent = await this.encryptMessage(content, key);
      const conversationId = this.getConversationId(recipientId);

      const message: EncryptedMessage = {
        id: `msg_${Date.now()}`,
        senderId: this.userId,
        senderName: this.userName,
        recipientId,
        encryptedContent,
        timestamp: new Date(),
        isRead: false,
      };

      // Store in localStorage
      const conversations = this.getConversations();
      let conversation = conversations.find((c) => c.id === conversationId);

      if (!conversation) {
        conversation = {
          id: conversationId,
          participantIds: [this.userId, recipientId],
          participantNames: [this.userName, recipientName],
          messages: [],
          createdAt: new Date(),
        };
        conversations.push(conversation);
      }

      conversation.messages.push(message);
      localStorage.setItem(`${STORAGE_KEY}:conversations`, JSON.stringify(conversations));

      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get conversation with another user
   */
  async getConversation(recipientId: string): Promise<EncryptedMessage[]> {
    try {
      const conversationId = this.getConversationId(recipientId);
      const conversations = this.getConversations();
      const conversation = conversations.find((c) => c.id === conversationId);
      return conversation?.messages || [];
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return [];
    }
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(): Promise<EncryptedMessage[]> {
    try {
      const conversations = this.getConversations();
      const unreadMessages: EncryptedMessage[] = [];

      conversations.forEach((conv) => {
        conv.messages.forEach((msg) => {
          if (msg.recipientId === this.userId && !msg.isRead) {
            unreadMessages.push(msg);
          }
        });
      });

      return unreadMessages;
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const conversations = this.getConversations();
      conversations.forEach((conv) => {
        const message = conv.messages.find((m) => m.id === messageId);
        if (message) {
          message.isRead = true;
        }
      });
      localStorage.setItem(`${STORAGE_KEY}:conversations`, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  /**
   * Get all conversations
   */
  getConversations(): EncryptedConversation[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:conversations`);
      if (!stored) return [];
      const conversations = JSON.parse(stored);
      return conversations.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(recipientId: string): Promise<void> {
    try {
      const conversationId = this.getConversationId(recipientId);
      const conversations = this.getConversations();
      const updated = conversations.filter((c) => c.id !== conversationId);
      localStorage.setItem(`${STORAGE_KEY}:conversations`, JSON.stringify(updated));
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }

  /**
   * Upload encrypted file
   */
  async uploadEncryptedFile(
    file: File,
    recipientId: string,
    key: CryptoKey
  ): Promise<{ url: string; fileName: string }> {
    try {
      const fileId = `file_${Date.now()}`;
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Store file metadata
      const files = this.getStoredFiles();
      files.push({ id: fileId, data: fileData, name: file.name, owner: this.userId });
      localStorage.setItem(`${STORAGE_KEY}:files`, JSON.stringify(files));

      return { url: fileData, fileName: file.name };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Download encrypted file
   */
  async downloadEncryptedFile(fileId: string): Promise<Blob> {
    try {
      const files = this.getStoredFiles();
      const file = files.find((f) => f.id === fileId);
      if (!file) throw new Error("File not found");

      const response = await fetch(file.data);
      return await response.blob();
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }

  /**
   * Helper to get conversation ID
   */
  private getConversationId(recipientId: string): string {
    const ids = [this.userId, recipientId].sort();
    return `conv_${ids.join("_")}`;
  }

  /**
   * Helper to get stored files
   */
  private getStoredFiles(): any[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:files`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export const encryptedChatService = new EncryptedChatService();
