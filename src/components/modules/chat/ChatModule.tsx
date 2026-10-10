"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  Hash, Lock, Send, Plus, Users, Search,
  Sparkles, Smile, Paperclip, MessageSquare, ShieldAlert
} from 'lucide-react';

export const ChatModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const chatChannels = useDemoStore((state) => state.chatChannels);
  const chatMessages = useDemoStore((state) => state.chatMessages);
  const activeChatChannelId = useDemoStore((state) => state.activeChatChannelId);
  const setActiveChatChannelId = useDemoStore((state) => state.setActiveChatChannelId);
  const sendChatMessage = useDemoStore((state) => state.sendChatMessage);

  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active channel
  const activeChannel = chatChannels.find(c => c.id === activeChatChannelId) || chatChannels[0];

  // Channel messages
  const currentMessages = chatMessages.filter(m => m.channelId === activeChannel?.id);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage.trim(), activeChannel.id);
    setInputMessage('');
  };

  const filteredChannels = chatChannels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl animate-fade-in">
      {/* 1. Left Channel Navigation Sidebar */}
      <div className="w-64 sm:w-72 border-r border-slate-800 bg-slate-950/60 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Workspace Chat
            </div>
            <h2 className="text-sm font-bold text-white mt-0.5">Kapate Team Channels</h2>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                  isActive 
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {channel.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </div>
                {Boolean(channel.unreadCount && channel.unreadCount > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current User Quick Badge */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col bg-slate-900/60">
        {/* Channel Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              {activeChannel?.isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Hash className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                #{activeChannel?.name}
                {activeChannel?.isPrivate && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Restricted
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeChannel?.description || 'Company internal channel'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {activeChannel?.members?.length || 1} members
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm text-slate-400 font-medium">No messages in this channel yet.</p>
              <p className="text-xs mt-1 text-slate-600">Start the conversation by sending a message below.</p>
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
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}>
                    {msg.senderName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className={`max-w-[75%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-slate-300">{msg.senderName}</span>
                      {msg.senderRole && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400">
                          {msg.senderRole}
                        </span>
                      )}
                      <span className="text-slate-500 text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm shadow-md' 
                        : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm shadow-sm'
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
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message #${activeChannel?.name || 'channel'}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
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
