import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { chatService, ChatConversation, ChatMessage, ChatUser } from '../../services/api/chatService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import './Chat.css';

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery(
    ['chat-conversations'],
    () => chatService.getConversations(),
    {
      refetchInterval: false, // Disabled automatic refetching
      refetchOnWindowFocus: false, // Disabled to prevent excessive calls
      refetchOnMount: true, // Only refetch on component mount
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery(
    ['chat-messages', selectedConversation?.id],
    () => selectedConversation ? chatService.getMessages(selectedConversation.id) : Promise.resolve([]),
    {
      enabled: !!selectedConversation,
      refetchInterval: false, // Disabled automatic refetching
      refetchOnWindowFocus: false, // Disabled to prevent excessive calls
      refetchOnMount: true, // Only refetch on component mount
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  // Get users for new chat
  const { data: users = [] } = useQuery(
    ['chat-users', searchTerm],
    () => chatService.getUsers({ search: searchTerm }),
    {
      enabled: showNewChatModal,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(chatService.sendMessage, {
    onSuccess: () => {
      setMessageText('');
      // Invalidate and refetch to get latest data
      queryClient.invalidateQueries(['chat-messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['chat-conversations']);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send message', 'error');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      receiver_id: selectedConversation.other_user_id,
      message: messageText.trim(),
    });
  };

  const handleStartNewChat = (selectedUser: ChatUser) => {
    // Find existing conversation
    const existingConv = conversations.find(
      (conv) => conv.other_user_id === selectedUser.id
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      setShowNewChatModal(false);
      setSearchTerm('');
    } else {
      // Create new conversation by sending a message
      sendMessageMutation.mutate(
        {
          receiver_id: selectedUser.id,
          message: '👋',
        },
        {
          onSuccess: () => {
            // Invalidate queries to refetch with new conversation
            queryClient.invalidateQueries(['chat-conversations']).then(() => {
              // Find the newly created conversation from cache
              const updatedConversations = queryClient.getQueryData<ChatConversation[]>(['chat-conversations']) || [];
              const newConv = updatedConversations.find(
                (conv) => conv.other_user_id === selectedUser.id
              );
              if (newConv) {
                setSelectedConversation(newConv);
              }
            });
            setShowNewChatModal(false);
            setSearchTerm('');
          },
        }
      );
    }
  };

  // Helper function to construct photo URL
  const getPhotoUrl = (photo?: string): string | null => {
    if (!photo || photo.trim() === '') return null;
    const photoStr = String(photo).trim();
    if (photoStr === 'null' || photoStr === 'undefined') return null;
    
    // If it's a file path (starts with /uploads/), construct full URL
    if (photoStr.startsWith('/uploads/')) {
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      const baseUrl = apiBaseUrl.replace('/api/v1', '');
      return `${baseUrl}${photoStr}`;
    }
    
    // If already a data URL (starts with data:image/), return as is - for backward compatibility
    if (photoStr.startsWith('data:image/')) {
      // Ensure it's a complete, valid data URL with base64 data
      if (photoStr.includes(',')) {
        const parts = photoStr.split(',');
        if (parts.length >= 2 && parts[1] && parts[1].length > 0) {
          // Return the full data URL as-is
          return photoStr;
        }
      }
      // If data URL is malformed, return null to show placeholder
      return null;
    }
    
    // If it's an external URL, return as is
    if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
      return photoStr;
    }
    
    // Otherwise, treat as relative file path
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    return `${baseUrl}${photoStr.startsWith('/') ? photoStr : '/' + photoStr}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Conversations List */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Messages</h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowNewChatModal(true)}
              title="New Message"
            >
              + New
            </button>
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => setShowNewChatModal(true)}
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    selectedConversation?.id === conversation.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {getPhotoUrl(conversation.other_user_photo) ? (
                      <img
                        src={getPhotoUrl(conversation.other_user_photo)!}
                        alt={conversation.other_user_name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder && placeholder.classList.contains('avatar-placeholder-fallback')) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`avatar-placeholder ${getPhotoUrl(conversation.other_user_photo) ? 'avatar-placeholder-fallback' : ''}`}
                      style={{ display: getPhotoUrl(conversation.other_user_photo) ? 'none' : 'flex' }}
                    >
                      {conversation.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">{conversation.other_user_name}</span>
                      {conversation.last_message_at && (
                        <span className="conversation-time">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-header-user">
                  {getPhotoUrl(selectedConversation.other_user_photo) ? (
                    <img
                      src={getPhotoUrl(selectedConversation.other_user_photo)!}
                      alt={selectedConversation.other_user_name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder && placeholder.classList.contains('avatar-placeholder-fallback')) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`avatar-placeholder ${getPhotoUrl(selectedConversation.other_user_photo) ? 'avatar-placeholder-fallback' : ''}`}
                    style={{ display: getPhotoUrl(selectedConversation.other_user_photo) ? 'none' : 'flex' }}
                  >
                    {selectedConversation.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{selectedConversation.other_user_name}</h3>
                    <span className="chat-user-email">{selectedConversation.other_user_email}</span>
                  </div>
                </div>
              </div>

              <div className="messages-container" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.is_sender ? 'sent' : 'received'}`}
                    >
                      {!message.is_sender && (
                        <div className="message-avatar">
                          {getPhotoUrl(message.sender_photo) ? (
                            <img 
                              src={getPhotoUrl(message.sender_photo)!} 
                              alt={message.sender_name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder && placeholder.classList.contains('avatar-placeholder-fallback')) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`avatar-placeholder small ${getPhotoUrl(message.sender_photo) ? 'avatar-placeholder-fallback' : ''}`}
                            style={{ display: getPhotoUrl(message.sender_photo) ? 'none' : 'flex' }}
                          >
                            {message.sender_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      <div className="message-content">
                        {!message.is_sender && (
                          <div className="message-sender">{message.sender_name}</div>
                        )}
                        <div className="message-bubble">
                          <p>{message.message}</p>
                          <span className="message-time">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sendMessageMutation.isLoading}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!messageText.trim() || sendMessageMutation.isLoading}
                >
                  {sendMessageMutation.isLoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-content">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowNewChatModal(true)}
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false);
          setSearchTerm('');
        }}
        title="New Message"
      >
        <div className="new-chat-modal">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="users-list">
            {users.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? 'No users found' : 'Start typing to search users'}
              </div>
            ) : (
              users.map((chatUser) => (
                <div
                  key={chatUser.id}
                  className="user-item"
                  onClick={() => handleStartNewChat(chatUser)}
                >
                  <div className="user-avatar">
                    {getPhotoUrl(chatUser.photo) ? (
                      <img 
                        src={getPhotoUrl(chatUser.photo)!} 
                        alt={chatUser.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder && placeholder.classList.contains('avatar-placeholder-fallback')) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`avatar-placeholder ${getPhotoUrl(chatUser.photo) ? 'avatar-placeholder-fallback' : ''}`}
                      style={{ display: getPhotoUrl(chatUser.photo) ? 'none' : 'flex' }}
                    >
                      {chatUser.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="user-info">
                    <div className="user-name">{chatUser.name}</div>
                    <div className="user-email">{chatUser.email}</div>
                    <div className="user-role">{chatUser.role_name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;

