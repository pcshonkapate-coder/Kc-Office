"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Hash, Lock, Send, Search, Users, Sparkles, MessageSquare } from 'lucide-react';

export const ChatModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const chatChannels = useDemoStore((state) => state.chatChannels);
  const activeChatChannelId = useDemoStore((state) => state.activeChatChannelId);
  const setActiveChatChannelId = useDemoStore((state) => state.setActiveChatChannelId);
  const chatMessages = useDemoStore((state) => state.chatMessages);
  const sendChatMessage = useDemoStore((state) => state.sendChatMessage);

  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = chatChannels.find(c => c.id === activeChatChannelId) || chatChannels[0];

  const currentMessages = chatMessages.filter(
    m => m.channelId === activeChannel?.id
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;
    sendChatMessage(activeChannel.id, inputMessage.trim());
    setInputMessage('');
  };

  const filteredChannels = chatChannels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-fade-in text-slate-900">
      {/* 1. Left Channel Navigation Sidebar */}
      <div className="w-64 sm:w-72 border-r border-slate-200 bg-slate-50 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Workspace Chat
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">Kapate Team Channels</h2>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Channels
          </div>
          {filteredChannels.map((channel) => {
            const isActive = channel.id === activeChannel?.id;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChatChannelId(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {channel.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </div>
                {Boolean(channel.unreadCount && channel.unreadCount > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current User Quick Badge */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Channel Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-blue-600">
              {activeChannel?.isPrivate ? <Lock className="w-4 h-4 text-amber-500" /> : <Hash className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                #{activeChannel?.name}
                {activeChannel?.isPrivate && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                    Restricted
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeChannel?.description || 'Company internal channel'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {activeChannel?.members?.length || 1} members
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
              <p className="text-sm text-slate-700 font-medium">No messages in this channel yet.</p>
              <p className="text-xs mt-1 text-slate-400">Start the conversation by sending a message below.</p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMe 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {msg.senderName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className={`max-w-[75%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      {msg.senderRole && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-500">
                          {msg.senderRole}
                        </span>
                      )}
                      <span className="text-slate-400 text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-xs' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Composer */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message #${activeChannel?.name || 'channel'}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ChatModule;
