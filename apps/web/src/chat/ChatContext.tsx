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
  markAsRead: (conversationId: string) => Promise<void>;
  typingUsers: Record<string, string>;
  sendTyping: (isTyping: boolean) => void;
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
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimersRef = useRef<Record<string, any>>({});

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

  // Mark as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to mark conversation read', err);
    }
  }, [token]);

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
    setTypingUsers({});
    if (id) {
      setIsDraft(false);
      setSelectedRecipients([]);
      setDraftTitle('');
      loadMessages(id);
      markAsRead(id);
      if (socket && socket.connected) {
        socket.emit('room:join', `chat:${id}`);
      }
    } else {
      setMessages([]);
    }
  }, [loadMessages, markAsRead, socket]);

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

  // Select 1:1 recipient in recipient picker (instant switch with cache)
  const selectRecipient = useCallback(async (recipient: MemberProfile) => {
    if (!token) return;
    setSelectedRecipients([recipient]);

    // Check if we already have this 1:1 conversation in memory
    const existingConv = conversations.find(
      (c) => c.type === 'DIRECT' && c.participants.some((p) => p.userId === recipient.id)
    );

    if (existingConv) {
      // Instant switch (0ms)
      setActiveConversationIdState(existingConv.id);
      setIsDraft(false);
      loadMessages(existingConv.id);
      if (socket && socket.connected) {
        socket.emit('room:join', `chat:${existingConv.id}`);
      }
      return;
    }

    // Default to draft immediately without blocking UI
    setIsDraft(true);
    setMessages([]);

    try {
      const res = await fetch(`/api/chat/direct/${recipient.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.conversation) {
          setActiveConversationIdState(data.conversation.id);
          setIsDraft(false);
          setMessages(data.messages || []);
          if (socket && socket.connected) {
            socket.emit('room:join', `chat:${data.conversation.id}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check direct conversation', err);
    }
  }, [token, socket, conversations, loadMessages]);

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

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !activeConversationId || !user) return;
      socket.emit('chat:typing', {
        conversationId: activeConversationId,
        userId: user.id,
        displayName: user.displayName,
        isTyping,
      });
    },
    [socket, activeConversationId, user],
  );

  // Send message with instant optimistic updates (0ms perceived latency)
  const sendMessage = useCallback(async (content: string) => {
    if (!token || !content.trim()) return;
    const trimmed = content.trim();

    if (isDraft && selectedRecipients.length > 0) {
      const recipient = selectedRecipients[0];
      const isSingleRecipient = selectedRecipients.length === 1;
      const tempMsgId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMsg: ChatMessage = {
        id: tempMsgId,
        conversationId: 'temp-draft',
        senderId: user?.id || '',
        content: trimmed,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user || undefined,
      };

      // Instantly show message in thread
      setMessages([optimisticMsg]);
      setIsDraft(false);

      try {
        if (isSingleRecipient) {
          // Direct 1:1 conversation
          const res = await fetch('/api/chat/conversations/direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientId: recipient.id,
              initialMessage: trimmed,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const newConv: ConversationSummary = data.conversation;
            const newMsg: ChatMessage | undefined = data.message;
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            setActiveConversationIdState(newConv.id);
            setSelectedRecipients([]);
            if (newMsg) {
              setMessages([newMsg]);
            }
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
              initialMessage: trimmed,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const newConv: ConversationSummary = data.conversation;
            const newMsg: ChatMessage | undefined = data.message;
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            setActiveConversationIdState(newConv.id);
            setSelectedRecipients([]);
            setDraftTitle('');
            if (newMsg) {
              setMessages([newMsg]);
            }
            if (socket && socket.connected) {
              socket.emit('room:join', `chat:${newConv.id}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to create conversation with message', err);
      }
    } else if (activeConversationId) {
      // Existing conversation: Instant 0ms optimistic delivery
      const tempMsgId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMsg: ChatMessage = {
        id: tempMsgId,
        conversationId: activeConversationId,
        senderId: user?.id || '',
        content: trimmed,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user || undefined,
      };

      // 1. Immediately append to active conversation (0ms)
      setMessages((prev) => [...prev, optimisticMsg]);

      // 2. Immediately update conversation in the left pane (0ms)
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === activeConversationId);
        if (!existing) return prev;
        const updated: ConversationSummary = {
          ...existing,
          lastMessage: optimisticMsg,
          updatedAt: optimisticMsg.createdAt,
        };
        return [updated, ...prev.filter((c) => c.id !== activeConversationId)];
      });

      // 3. Dispatch to server in background
      try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: trimmed }),
        });

        if (res.ok) {
          const sentMessage: ChatMessage = await res.json();
          // Replace optimistic placeholder with confirmed server message
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMsgId ? sentMessage : m))
          );
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId ? { ...c, lastMessage: sentMessage } : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to send message', err);
      }
    }
  }, [token, isDraft, selectedRecipients, draftTitle, activeConversationId, socket, user]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      if (activeConvIdRef.current === msg.conversationId) {
        setMessages((prev) => {
          // If already exists with server ID, ignore duplicate
          if (prev.some((m) => m.id === msg.id)) return prev;
          // If we have an optimistic message matching this sender and content, reconcile it
          const optIndex = prev.findIndex(
            (m) =>
              m.id.startsWith('opt-') &&
              m.senderId === msg.senderId &&
              m.content === msg.content
          );
          if (optIndex !== -1) {
            const next = [...prev];
            next[optIndex] = msg;
            return next;
          }
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

    const handleTyping = (payload: {
      conversationId: string;
      userId: string;
      displayName: string;
      isTyping: boolean;
    }) => {
      if (payload.conversationId !== activeConvIdRef.current || payload.userId === user?.id) return;

      setTypingUsers((prev) => {
        if (!payload.isTyping) {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        }
        return { ...prev, [payload.userId]: payload.displayName };
      });

      if (typingTimersRef.current[payload.userId]) {
        clearTimeout(typingTimersRef.current[payload.userId]);
      }

      if (payload.isTyping) {
        typingTimersRef.current[payload.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[payload.userId];
            return next;
          });
        }, 3000);
      }
    };

    const handleRead = (payload: { conversationId: string; userId: string; lastReadAt: string | Date }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          return {
            ...c,
            participants: c.participants.map((p) =>
              p.userId === payload.userId ? { ...p, lastReadAt: payload.lastReadAt } : p
            ),
          };
        })
      );
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:conversation_updated', handleConversationUpdated);
    socket.on('chat:participant_removed', handleParticipantRemoved);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:conversation_updated', handleConversationUpdated);
      socket.off('chat:participant_removed', handleParticipantRemoved);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
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
        markAsRead,
        typingUsers,
        sendTyping,
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
  typingUsers: {},
  sendTyping: () => {},
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
  markAsRead: async () => {},
  sendMessage: async () => {},
  loadConversations: async () => {},
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  return context || defaultChatContext;
};
