import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ConversationSummary, ChatMessage, MemberProfile, HistoryShareOption } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';

interface ChatContextType {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  activeConversation: ConversationSummary | null;
  activeRecipient: MemberProfile | null;
  selectedRecipients: MemberProfile[];
  draftTitle: string;
  messages: ChatMessage[];
  isDraft: boolean;
  isLoading: boolean;
  setActiveConversationId: (id: string | null) => void;
  startDraftChat: (recipient?: MemberProfile | null) => void;
  selectRecipient: (recipient: MemberProfile) => Promise<void>;
  addDraftRecipient: (recipient: MemberProfile) => void;
  removeDraftRecipient: (recipientId: string) => void;
  setDraftTitle: (title: string) => void;
  updateGroupTitle: (conversationId: string, title: string) => Promise<void>;
  addParticipant: (
    conversationId: string,
    userId: string,
    historyOption?: HistoryShareOption,
    historyDays?: number,
  ) => Promise<void>;
  removeParticipant: (conversationId: string, userId: string) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  togglePin: (conversationId: string) => Promise<void>;
  toggleMute: (conversationId: string) => Promise<void>;
  hideConversation: (conversationId: string) => Promise<void>;
  markAsUnread: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { socket, subscribeUsers } = usePresence();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<MemberProfile[]>([]);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  // Single active recipient for 1:1 convenience
  const activeRecipient = selectedRecipients.length === 1 ? selectedRecipients[0] : null;

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
      setSelectedRecipients([]);
      setDraftTitle('');
      loadMessages(id);
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
    setDraftTitle('');
    if (recipient) {
      setSelectedRecipients([recipient]);
    } else {
      setSelectedRecipients([]);
      setMessages([]);
    }
  }, []);

  const addDraftRecipient = useCallback((recipient: MemberProfile) => {
    setSelectedRecipients((prev) => {
      if (prev.some((r) => r.id === recipient.id)) return prev;
      return [...prev, recipient];
    });
  }, []);

  const removeDraftRecipient = useCallback((recipientId: string) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== recipientId));
  }, []);

  // Select 1:1 recipient in recipient picker
  const selectRecipient = useCallback(async (recipient: MemberProfile) => {
    if (!token) return;
    setSelectedRecipients([recipient]);
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

  // Update group title
  const updateGroupTitle = useCallback(async (conversationId: string, title: string) => {
    if (!token || !title.trim()) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) {
        const updated: ConversationSummary = await res.json();
        setConversations((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
      }
    } catch (err) {
      console.error('Failed to update group title', err);
    }
  }, [token]);

  // Add participant to group chat
  const addParticipant = useCallback(
    async (
      conversationId: string,
      userId: string,
      historyOption: HistoryShareOption = 'none',
      historyDays = 1,
    ) => {
      if (!token) return;
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, historyOption, historyDays }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.conversation) {
            setConversations((prev) => [data.conversation, ...prev.filter((c) => c.id !== data.conversation.id)]);
          }
          if (data.message && activeConvIdRef.current === conversationId) {
            setMessages((prev) => [...prev, data.message]);
          }
        }
      } catch (err) {
        console.error('Failed to add participant', err);
      }
    },
    [token],
  );

  // Remove participant from group chat
  const removeParticipant = useCallback(async (conversationId: string, targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/participants/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadConversations();
        if (activeConvIdRef.current === conversationId) {
          await loadMessages(conversationId);
        }
      }
    } catch (err) {
      console.error('Failed to remove participant', err);
    }
  }, [token, loadConversations, loadMessages]);

  // Leave group chat
  const leaveGroup = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConvIdRef.current === conversationId) {
          setActiveConversationIdState(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to leave group chat', err);
    }
  }, [token]);

  // Toggle Pin
  const togglePin = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  }, [token]);

  // Toggle Mute
  const toggleMute = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/mute`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle mute', err);
    }
  }, [token]);

  // Hide conversation
  const hideConversation = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/hide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConvIdRef.current === conversationId) {
          setActiveConversationIdState(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to hide conversation', err);
    }
  }, [token]);

  // Mark as unread
  const markAsUnread = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/unread`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: Math.max(1, (c.unreadCount || 0) + 1) } : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark as unread', err);
    }
  }, [token]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!token || !content.trim()) return;

    if (isDraft && selectedRecipients.length > 0) {
      setIsLoading(true);
      try {
        if (selectedRecipients.length === 1) {
          // Direct 1:1 conversation
          const res = await fetch('/api/chat/conversations/direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientId: selectedRecipients[0].id,
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
            setSelectedRecipients([]);
            if (newMsg) setMessages([newMsg]);
            if (socket && socket.connected) {
              socket.emit('room:join', `chat:${newConv.id}`);
            }
          }
        } else {
          // Group conversation (2 to 250 participants)
          const res = await fetch('/api/chat/conversations/group', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientIds: selectedRecipients.map((r) => r.id),
              title: draftTitle.trim() || undefined,
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
            setSelectedRecipients([]);
            setDraftTitle('');
            if (newMsg) setMessages([newMsg]);
            if (socket && socket.connected) {
              socket.emit('room:join', `chat:${newConv.id}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to create conversation with message', err);
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === sentMessage.id)) return prev;
            return [...prev, sentMessage];
          });
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
  }, [token, isDraft, selectedRecipients, draftTitle, activeConversationId, socket]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      if (activeConvIdRef.current === msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c.id === msg.conversationId);
        if (convIndex === -1) {
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

    const handleParticipantRemoved = (payload: { conversationId: string; userId: string }) => {
      if (payload.userId === user?.id) {
        setConversations((prev) => prev.filter((c) => c.id !== payload.conversationId));
        if (activeConvIdRef.current === payload.conversationId) {
          setActiveConversationIdState(null);
          setMessages([]);
        }
      } else {
        loadConversations();
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:conversation_updated', handleConversationUpdated);
    socket.on('chat:participant_removed', handleParticipantRemoved);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:conversation_updated', handleConversationUpdated);
      socket.off('chat:participant_removed', handleParticipantRemoved);
    };
  }, [socket, user?.id, loadConversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        activeRecipient,
        selectedRecipients,
        draftTitle,
        messages,
        isDraft,
        isLoading,
        setActiveConversationId,
        startDraftChat,
        selectRecipient,
        addDraftRecipient,
        removeDraftRecipient,
        setDraftTitle,
        updateGroupTitle,
        addParticipant,
        removeParticipant,
        leaveGroup,
        togglePin,
        toggleMute,
        hideConversation,
        markAsUnread,
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
  selectedRecipients: [],
  draftTitle: '',
  messages: [],
  isDraft: false,
  isLoading: false,
  setActiveConversationId: () => {},
  startDraftChat: () => {},
  selectRecipient: async () => {},
  addDraftRecipient: () => {},
  removeDraftRecipient: () => {},
  setDraftTitle: () => {},
  updateGroupTitle: async () => {},
  addParticipant: async () => {},
  removeParticipant: async () => {},
  leaveGroup: async () => {},
  togglePin: async () => {},
  toggleMute: async () => {},
  hideConversation: async () => {},
  markAsUnread: async () => {},
  sendMessage: async () => {},
  loadConversations: async () => {},
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  return context || defaultChatContext;
};
