'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/authStore';
import {
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Send,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export default function CommunicationChatPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // 1. Fetch Channels
  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ['communication', 'channels'],
    queryFn: async () => {
      const { data } = await apiClient.get('/communication/channels');
      return data;
    },
  });

  // Select first channel automatically
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // 2. Fetch Messages for selected channel
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['communication', 'messages', selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const { data } = await apiClient.get(`/communication/channels/${selectedChannelId}/messages`);
      return data;
    },
    enabled: !!selectedChannelId,
  });

  // 3. WebSocket Connection
  useEffect(() => {
    if (!selectedChannelId) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1')
      .replace('http', 'ws')
      .replace('/api/v1', '');
    const ws = new WebSocket(`${wsUrl}/api/v1/communication/ws/${selectedChannelId}`);
    socketRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const received = JSON.parse(event.data);
        if (received) {
          queryClient.invalidateQueries({ queryKey: ['communication', 'messages', selectedChannelId] });
        }
      } catch (e) {
        // Fallback
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [selectedChannelId, queryClient]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/communication/channels/${selectedChannelId}/messages`, {
        content,
      });
      return data;
    },
    onSuccess: (data) => {
      // Broadcast via socket if open
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      }
      queryClient.invalidateQueries({ queryKey: ['communication', 'messages', selectedChannelId] });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/communication/channels', {
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        topic: newChannelTopic,
        is_private: newChannelIsPrivate,
      });
      return data;
    },
    onSuccess: (newChan) => {
      setIsNewChannelModalOpen(false);
      setNewChannelName('');
      setNewChannelTopic('');
      queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] });
      setSelectedChannelId(newChan.id);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannelId) return;
    const msg = messageInput;
    setMessageInput('');
    sendMessageMutation.mutate(msg);
  };

  const currentChannel = channels.find((c: any) => c.id === selectedChannelId);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs font-sans">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-slate-50/80 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Internal Comms</h3>
          </div>
          <button
            onClick={() => setIsNewChannelModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shadow-2xs transition-colors"
            title="Create Channel"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Channels ({channels.length})
          </div>
          {loadingChannels ? (
            <div className="p-3 text-xs text-slate-400">Loading channels...</div>
          ) : (
            channels.map((chan: any) => {
              const isActive = chan.id === selectedChannelId;
              return (
                <button
                  key={chan.id}
                  onClick={() => setSelectedChannelId(chan.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {chan.is_private ? (
                      <Lock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    ) : (
                      <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate">{chan.name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {currentChannel ? (
          <>
            {/* Channel Top Header */}
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{currentChannel.name}</h3>
                  <p className="text-[11px] text-slate-500">{currentChannel.topic || 'Enterprise team discussions'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div
                  className={`flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                    wsConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {wsConnected ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-slate-400" />}
                  <span>{wsConnected ? 'LIVE WS' : 'REST SYNC'}</span>
                </div>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {loadingMessages ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading channel history...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center space-y-1 text-slate-500 text-xs">
                  <p className="font-semibold text-slate-700">Welcome to #{currentChannel.name}!</p>
                  <p>This is the start of this channel. Send the first message below.</p>
                </div>
              ) : (
                messages.map((m: any) => {
                  const isMine = m.sender_id === currentUser?.userId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 mb-1">
                        <span className="font-semibold text-slate-600">{m.sender_name || 'Staff User'}</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMine
                            ? 'bg-slate-900 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Message #${currentChannel.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            Select or create a channel to start communicating.
          </div>
        )}
      </div>

      {/* CREATE CHANNEL MODAL */}
      {isNewChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Enterprise Channel</h3>
              <button onClick={() => setIsNewChannelModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Name</label>
                <div className="relative flex items-center">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    placeholder="client-success"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Purpose (Optional)</label>
                <input
                  type="text"
                  placeholder="Daily standups & architecture sync"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={newChannelIsPrivate}
                  onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="is_private" className="text-xs text-slate-700 font-medium">
                  Make Private (Invite only)
                </label>
              </div>

              <button
                onClick={() => createChannelMutation.mutate()}
                disabled={!newChannelName.trim() || createChannelMutation.isPending}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40 transition-colors"
              >
                {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
