import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Message, Conversation, SafetyResources } from '../types';
import MessageBubble from '../components/chat/MessageBubble';
import SafetyAlert from '../components/chat/SafetyAlert';
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [safetyResources, setSafetyResources] = useState<SafetyResources | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const response = await api.get('/api/chat/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  async function loadMessages(id: string) {
    setLoading(true);
    try {
      const response = await api.get(`/api/chat/conversations/${id}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createConversation() {
    try {
      const response = await api.post('/api/chat/conversations', {
        title: 'New Conversation',
      });
      setConversations([response.data.conversation, ...conversations]);
      navigate(`/chat/${response.data.conversation.id}`);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation?')) return;

    try {
      await api.delete(`/api/chat/conversations/${id}`);
      setConversations(conversations.filter((c) => c.id !== id));
      if (conversationId === id) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    let activeConversationId = conversationId;

    // Create new conversation if none selected
    if (!activeConversationId) {
      try {
        const response = await api.post('/api/chat/conversations', {
          title: input.substring(0, 50),
        });
        activeConversationId = response.data.conversation.id;
        setConversations([response.data.conversation, ...conversations]);
        navigate(`/chat/${activeConversationId}`, { replace: true });
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    setSending(true);
    const userMessage = input;
    setInput('');

    // Optimistic update
    const tempUserMessage: Message = {
      id: 'temp-user',
      conversation_id: activeConversationId,
      role: 'user',
      content: userMessage,
      flagged_crisis: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await api.post(
        `/api/chat/conversations/${activeConversationId}/messages`,
        { content: userMessage }
      );

      // Replace temp message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp-user'),
        response.data.userMessage,
        response.data.aiMessage,
      ]);

      // Show safety resources if crisis detected
      if (response.data.crisisDetected && response.data.safetyResources) {
        setSafetyResources(response.data.safetyResources);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user'));
      setInput(userMessage);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transform transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold">Conversations</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={createConversation}
            className="m-4 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-3 mx-2 rounded-lg cursor-pointer ${
                  conversationId === conv.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  navigate(`/chat/${conv.id}`);
                  setSidebarOpen(false);
                }}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-semibold">AI Coach</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with your AI coach</p>
              <p className="text-sm mt-2">
                Share what's on your mind or what you'd like to work on
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              </div>
              <div className="bg-white shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Safety Resources */}
        {safetyResources && (
          <SafetyAlert
            resources={safetyResources}
            onClose={() => setSafetyResources(null)}
          />
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
