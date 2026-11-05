import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ConversationSummary, ChatMessage, MemberProfile } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';

interface ChatContextType {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  activeConversation: ConversationSummary | null;
  activeRecipient: MemberProfile | null;
  messages: ChatMessage[];
  isDraft: boolean;
  isLoading: boolean;
  setActiveConversationId: (id: string | null) => void;
  startDraftChat: (recipient?: MemberProfile | null) => void;
  selectRecipient: (recipient: MemberProfile) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { socket, subscribeUsers } = usePresence();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [activeRecipient, setActiveRecipient] = useState<MemberProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  // Load all user conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ConversationSummary[] = await res.json();
        setConversations(data);

        // Subscribe to presence for all participants
        const userIds = new Set<string>();
        data.forEach((c) => {
          c.participants.forEach((p) => {
            if (p.userId !== user?.id) userIds.add(p.userId);
          });
        });
        if (userIds.size > 0) {
          subscribeUsers(Array.from(userIds));
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, [token, user?.id, subscribeUsers]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    if (id) {
      setIsDraft(false);
      setActiveRecipient(null);
      loadMessages(id);
      // Join chat room via socket
      if (socket && socket.connected) {
        socket.emit('room:join', `chat:${id}`);
      }
    } else {
      setMessages([]);
    }
  }, [loadMessages, socket]);

  // Start draft new chat
  const startDraftChat = useCallback((recipient?: MemberProfile | null) => {
    setActiveConversationIdState(null);
    setIsDraft(true);
    if (recipient) {
      selectRecipient(recipient);
    } else {
      setActiveRecipient(null);
      setMessages([]);
    }
  }, []);

  // Select recipient in recipient picker
  const selectRecipient = useCallback(async (recipient: MemberProfile) => {
    if (!token) return;
    setActiveRecipient(recipient);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/direct/${recipient.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.conversation) {
          // Existing 1:1 conversation found!
          setActiveConversationIdState(data.conversation.id);
          setIsDraft(false);
          setMessages(data.messages || []);
          if (socket && socket.connected) {
            socket.emit('room:join', `chat:${data.conversation.id}`);
          }
        } else {
          // New draft conversation
          setIsDraft(true);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to check direct conversation', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, socket]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!token || !content.trim()) return;

    if (isDraft && activeRecipient) {
      // First message in draft conversation
      setIsLoading(true);
      try {
        const res = await fetch('/api/chat/conversations/direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: activeRecipient.id,
            initialMessage: content.trim(),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newConv: ConversationSummary = data.conversation;
          const newMsg: ChatMessage | undefined = data.message;

          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          setActiveConversationIdState(newConv.id);
          setIsDraft(false);
          if (newMsg) {
            setMessages([newMsg]);
          }
          if (socket && socket.connected) {
            socket.emit('room:join', `chat:${newConv.id}`);
          }
        }
      } catch (err) {
        console.error('Failed to create direct conversation with initial message', err);
      } finally {
        setIsLoading(false);
      }
    } else if (activeConversationId) {
      // Message in existing conversation
      try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (res.ok) {
          const sentMessage: ChatMessage = await res.json();
          // Optimistically append if not already received from socket
          setMessages((prev) => {
            if (prev.some((m) => m.id === sentMessage.id)) return prev;
            return [...prev, sentMessage];
          });
          // Update conversation in list
          setConversations((prev) => {
            const existing = prev.find((c) => c.id === activeConversationId);
            if (!existing) return prev;
            const updated: ConversationSummary = {
              ...existing,
              lastMessage: sentMessage,
              updatedAt: sentMessage.createdAt,
            };
            return [updated, ...prev.filter((c) => c.id !== activeConversationId)];
          });
        }
      } catch (err) {
        console.error('Failed to send message', err);
      }
    }
  }, [token, isDraft, activeRecipient, activeConversationId, socket]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      // If message is for currently active conversation, append it
      if (activeConvIdRef.current === msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversations list summary
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c.id === msg.conversationId);
        if (convIndex === -1) {
          // If conversation is not in list yet, reload conversations
          loadConversations();
          return prev;
        }
        const currentConv = prev[convIndex];
        const updatedConv: ConversationSummary = {
          ...currentConv,
          lastMessage: msg,
          updatedAt: msg.createdAt,
        };
        return [updatedConv, ...prev.filter((c) => c.id !== msg.conversationId)];
      });
    };

    const handleConversationUpdated = (conv: ConversationSummary) => {
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:conversation_updated', handleConversationUpdated);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:conversation_updated', handleConversationUpdated);
    };
  }, [socket, loadConversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        activeRecipient,
        messages,
        isDraft,
        isLoading,
        setActiveConversationId,
        startDraftChat,
        selectRecipient,
        sendMessage,
        loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const defaultChatContext: ChatContextType = {
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  activeRecipient: null,
  messages: [],
  isDraft: false,
  isLoading: false,
  setActiveConversationId: () => {},
  startDraftChat: () => {},
  selectRecipient: async () => {},
  sendMessage: async () => {},
  loadConversations: async () => {},
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  return context || defaultChatContext;
};
