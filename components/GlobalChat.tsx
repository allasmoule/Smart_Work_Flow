'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, Message, Profile } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function GlobalChat() {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const channel = supabase
                .channel('public:messages')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    (payload) => {
                        fetchNewMessageProfile(payload.new as Message);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    async function fetchNewMessageProfile(msg: Message) {
        // Fetch profile for the new message sender
        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', msg.user_id)
            .single();

        const msgWithProfile = { ...msg, profile: senderProfile };
        setMessages((prev) => [...prev, msgWithProfile]);
    }

    async function fetchMessages() {
        setLoading(true);
        const { data } = await supabase
            .from('messages')
            .select('*, profile:profiles(*)')
            .order('created_at', { ascending: true })
            .limit(50);

        if (data) {
            // Map the joined profile correctly if needed, though Supabase returns it as 'profile' property usually
            // if using the select query above.
            // Prisma/Supabase types might need casting
            const typedData = data.map(d => ({
                ...d,
                profile: Array.isArray(d.profile) ? d.profile[0] : d.profile
            })) as unknown as Message[];
            setMessages(typedData);
        }
        setLoading(false);
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase
            .from('messages')
            .insert({
                content,
                user_id: user.id
            });

        if (error) {
            console.error('Error sending message:', error);
            // specific error handling if needed
        }
    }

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700"
                >
                    <MessageCircle className="h-8 w-8 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-80 h-96 flex flex-col shadow-2xl border-slate-200">
                    <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-indigo-600 text-white rounded-t-lg">
                        <CardTitle className="text-base font-semibold flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Team Chat
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-indigo-700 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50">
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {loading && <p className="text-center text-xs text-muted-foreground">Loading messages...</p>}
                                {messages.map((msg) => {
                                    const isMe = msg.user_id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`p-2 rounded-lg text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-800 shadow-sm'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                    {isMe ? 'You' : msg.profile?.full_name?.split(' ')[0] || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSend} className="p-3 border-t bg-white flex items-center gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 h-9 text-sm"
                            />
                            <Button type="submit" size="icon" className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700">
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
