'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface SupportRoom {
  id: string;
  type: string;
  title: string;
  customerName: string;
  participants: { id: string; fullName: string }[];
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 5000;

export default function AdminSupportPage() {
  const { tokens, user } = useAuth();
  const [rooms, setRooms] = useState<SupportRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRooms = useCallback(async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<SupportRoom[]>('/api/v1/chat/admin/support-rooms', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) setRooms(res.data);
    } catch {
      // ignore
    }
  }, [tokens?.accessToken]);

  const loadMessages = useCallback(async (roomId: string) => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<{ messages: Message[]; nextCursor: string | null }>(
        `/api/v1/chat/rooms/${roomId}/messages?limit=100`,
        { token: tokens.accessToken },
      );
      if (res.status === 'success' && res.data) {
        setMessages(res.data.messages.reverse());
      }
      // Mark as read
      await api(`/api/v1/chat/rooms/${roomId}/read`, {
        method: 'POST',
        token: tokens.accessToken,
      });
    } catch {
      // ignore
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    loadRooms().finally(() => setLoading(false));
  }, [loadRooms]);

  // Poll for new messages and room list
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadRooms();
      if (selectedRoomId) loadMessages(selectedRoomId);
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadRooms, loadMessages, selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMessages([]);
    loadMessages(roomId);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !tokens?.accessToken || !selectedRoomId) return;
    setSending(true);
    const text = input;
    setInput('');
    try {
      const res = await api<Message>(`/api/v1/chat/rooms/${selectedRoomId}/messages`, {
        method: 'POST',
        body: { content: text },
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setMessages((prev) => [...prev, res.data!]);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Destek Mesajları</h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Room List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto rounded-xl border border-slate-700/50 bg-[#0d1b2a]">
          {rooms.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Henüz destek talebi yok
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className={`w-full border-b border-slate-700/30 px-4 py-3 text-left transition hover:bg-slate-700/30 ${
                  selectedRoomId === room.id ? 'bg-blue-600/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {room.customerName}
                  </span>
                  {room.lastMessage && !room.lastMessage.isRead && room.lastMessage.senderId !== user?.id && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                {room.lastMessage && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {room.lastMessage.content}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-slate-600">
                  {room.lastMessage
                    ? new Date(room.lastMessage.createdAt).toLocaleString('tr-TR')
                    : new Date(room.updatedAt).toLocaleString('tr-TR')}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-slate-700/50 bg-[#0d1b2a]">
          {!selectedRoomId ? (
            <div className="flex flex-1 items-center justify-center text-slate-500">
              Bir sohbet seçin
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Henüz mesaj yok
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-700/50 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {!isMe && (
                          <p className="mb-1 text-xs font-semibold text-blue-400">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            isMe ? 'text-blue-200/60' : 'text-slate-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700/50 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Mesajinizi yazin..."
                    className="flex-1 rounded-lg border border-slate-600 bg-[#0a1628] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                    maxLength={2000}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? '...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
