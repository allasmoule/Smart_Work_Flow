'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { supabase, Profile } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  User,
  Bot,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  is_system?: boolean;
};

export type ChatWindow = {
  id: string;
  title: string;
  worker_id: string | null;
  worker_name: string;
  is_minimized: boolean;
  is_maximized: boolean;
  messages: ChatMessage[];
  unread_count: number;
};

export function DigitalChatDashboard() {
  const { profile } = useAuth();
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadWorkers();
    loadChatWindows();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatWindows]);

  async function loadWorkers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('full_name', { ascending: true });

    if (!error && data) {
      setWorkers(data);
      // Initialize chat windows for each worker
      const initialChats: ChatWindow[] = data.map((worker: Profile) => ({
        id: `chat-${worker.id}`,
        title: worker.full_name,
        worker_id: worker.id,
        worker_name: worker.full_name,
        is_minimized: false,
        is_maximized: false,
        messages: [],
        unread_count: 0,
      }));
      setChatWindows(initialChats);
      if (initialChats.length > 0) {
        setActiveChatId(initialChats[0].id);
      }
    }
  }

  async function loadChatWindows() {
    // Load existing messages from localStorage or create new chats
    const savedChats = localStorage.getItem('admin_chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChatWindows(parsed);
      } catch (e) {
        console.error('Error loading saved chats:', e);
      }
    }
  }

  function subscribeToMessages() {
    // Real-time subscription would go here if we had a messages table
    // For now, we'll use localStorage for persistence
  }

  function scrollToBottom(chatId?: string) {
    const targetId = chatId || activeChatId;
    if (targetId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function sendMessage(chatId: string) {
    const message = messageInput[chatId]?.trim();
    if (!message || !profile) return;

    const chatWindow = chatWindows.find((c) => c.id === chatId);
    if (!chatWindow) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      chat_id: chatId,
      sender_id: profile.id,
      sender_name: profile.full_name,
      message,
      created_at: new Date().toISOString(),
      is_system: false,
    };

    const updatedChats = chatWindows.map((chat: ChatWindow) => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
        };
      }
      return chat;
    });

    setChatWindows(updatedChats);
    setMessageInput({ ...messageInput, [chatId]: '' });
    saveChatsToStorage(updatedChats);

    // Auto-reply simulation (you can replace this with real bot logic)
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        chat_id: chatId,
        sender_id: chatWindow.worker_id || 'bot',
        sender_name: chatWindow.worker_name,
        message: `Thank you for your message! I'll get back to you soon.`,
        created_at: new Date().toISOString(),
        is_system: false,
      };

      const finalChats = chatWindows.map((chat: ChatWindow) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage, botMessage],
          };
        }
        return chat;
      });

      setChatWindows(finalChats);
      saveChatsToStorage(finalChats);
    }, 1000);
  }

  function saveChatsToStorage(chats: ChatWindow[]) {
    localStorage.setItem('admin_chats', JSON.stringify(chats));
  }

  function toggleMinimize(chatId: string) {
    setChatWindows(
      chatWindows.map((chat: ChatWindow) =>
        chat.id === chatId ? { ...chat, is_minimized: !chat.is_minimized } : chat
      )
    );
  }

  function toggleMaximize(chatId: string) {
    setChatWindows(
      chatWindows.map((chat: ChatWindow) =>
        chat.id === chatId ? { ...chat, is_maximized: !chat.is_maximized } : chat
      )
    );
  }

  function closeChat(chatId: string) {
    setChatWindows(chatWindows.filter((chat: ChatWindow) => chat.id !== chatId));
    if (activeChatId === chatId) {
      const remaining = chatWindows.filter((chat: ChatWindow) => chat.id !== chatId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>, chatId: string) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatId);
    }
  }

  const openChats = chatWindows.filter((chat) => !chat.is_minimized);
  const minimizedChats = chatWindows.filter((chat) => chat.is_minimized);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Digital Chat Dashboard</h2>
          <p className="text-sm text-slate-600">
            Communicate with your team members in real-time
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {chatWindows.length} Active Chats
        </Badge>
      </div>

      {/* Minimized Chats Bar */}
      {minimizedChats.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {minimizedChats.map((chat) => (
            <Button
              key={chat.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setChatWindows(
                  chatWindows.map((c: ChatWindow) =>
                    c.id === chat.id ? { ...c, is_minimized: false } : c
                  )
                );
                setActiveChatId(chat.id);
              }}
              className="relative"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {chat.title}
              {chat.unread_count > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {chat.unread_count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Chat Windows Grid */}
      <div
        className={cn(
          'grid gap-4',
          openChats.length === 1
            ? 'grid-cols-1'
            : openChats.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {openChats.map((chat: ChatWindow) => (
          <Card
            key={chat.id}
            className={cn(
              'flex flex-col h-[500px]',
              chat.is_maximized && 'md:col-span-2 lg:col-span-3',
              activeChatId === chat.id && 'ring-2 ring-blue-500'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {chat.worker_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                <div>
                  <CardTitle className="text-base">{chat.title}</CardTitle>
                  <p className="text-xs text-slate-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleMinimize(chat.id)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleMaximize(chat.id)}
                >
                  {chat.is_maximized ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => closeChat(chat.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-3">
                  {chat.messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chat.messages.map((msg: ChatMessage) => {
                      const isOwnMessage = msg.sender_id === profile?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-2',
                            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {isOwnMessage ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'flex flex-col max-w-[75%]',
                              isOwnMessage ? 'items-end' : 'items-start'
                            )}
                          >
                            <div
                              className={cn(
                                'rounded-lg px-3 py-2 text-sm',
                                isOwnMessage
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-100 text-slate-900'
                              )}
                            >
                              {msg.message}
                            </div>
                            <span className="text-xs text-slate-500 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      inputRefs.current[chat.id] = el;
                    }}
                    placeholder="Type a message..."
                    value={messageInput[chat.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMessageInput({ ...messageInput, [chat.id]: e.target.value })
                    }
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, chat.id)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMessage(chat.id)}
                    disabled={!messageInput[chat.id]?.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {openChats.length === 0 && (
        <Card className="p-12 text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold mb-2">No Active Chats</h3>
          <p className="text-slate-600">
            All chat windows are minimized. Click on a minimized chat to restore it.
          </p>
        </Card>
      )}
    </div>
  );
}

