import { apiClient } from './apiClient';

export interface ChatConversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_email: string;
  other_user_photo?: string;
  unread_count: number;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender_name: string;
  sender_email: string;
  sender_photo?: string;
  is_sender: boolean;
}

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  photo?: string;
  role_name: string;
}

export const chatService = {
  // Get all conversations for the current user
  async getConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get('/chat/conversations');
    return response.data.data || [];
  },

  // Get messages for a specific conversation
  async getMessages(conversationId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<ChatMessage[]> {
    const response = await apiClient.get(`/chat/messages/${conversationId}`, { params });
    return response.data.data || [];
  },

  // Send a message
  async sendMessage(data: {
    receiver_id: number;
    message: string;
  }): Promise<ChatMessage> {
    const response = await apiClient.post('/chat/messages', data);
    return response.data.data;
  },

  // Get users list for starting a new conversation
  async getUsers(params?: {
    search?: string;
  }): Promise<ChatUser[]> {
    const response = await apiClient.get('/chat/users', { params });
    return response.data.data || [];
  },
};

