import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Mail,
  Clock,
  User,
  Bot,
  Paperclip,
  Image,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support' | 'bot';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  avatar?: string;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatAgent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  responseTime: string;
}

interface LiveChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  onClose?: () => void;
  className?: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  position = 'bottom-right',
  theme = 'light',
  onClose,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<ChatAgent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data
  const mockAgent: ChatAgent = {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Front Desk Support',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c8e7?w=32&h=32&fit=crop&crop=face',
    isOnline: true,
    responseTime: 'Usually responds in ~2 min'
  };

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Welcome to Hotel Support! How can I help you today?',
      sender: 'bot',
      timestamp: new Date(Date.now() - 300000),
      type: 'text',
      senderName: 'Support Bot'
    },
    {
      id: '2',
      content: 'I need help with room 205 - the guest is reporting an issue with the AC',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000),
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      content: 'I\'ve connected you with Sarah from our front desk team. She\'ll assist you right away.',
      sender: 'bot',
      timestamp: new Date(Date.now() - 180000),
      type: 'system',
      senderName: 'Support Bot'
    }
  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(mockMessages);
      setCurrentAgent(mockAgent);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'sent' } 
          : msg
      ));
    }, 500);

    // Simulate agent typing
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: getAutoResponse(message),
        sender: 'support',
        timestamp: new Date(),
        type: 'text',
        senderName: currentAgent?.name || 'Support Agent',
        avatar: currentAgent?.avatar
      };
      setMessages(prev => [...prev, response]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 3000);
  };

  const getAutoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('room') && lowerMessage.includes('ac')) {
      return "I've dispatched our maintenance team to room 205 to check the AC. They should be there within 10 minutes. Is there anything else I can help with?";
    }
    if (lowerMessage.includes('housekeeping')) {
      return "I'll contact housekeeping right away. What specific assistance do you need?";
    }
    if (lowerMessage.includes('guest') && lowerMessage.includes('complaint')) {
      return "I understand this is urgent. I'm escalating this to our guest relations manager. They'll contact you within 5 minutes.";
    }
    
    return "Thank you for reaching out. I'm looking into this right away and will get back to you shortly.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'bottom-right': return `${base} bottom-4 right-4`;
      case 'bottom-left': return `${base} bottom-4 left-4`;
      case 'top-right': return `${base} top-4 right-4`;
      case 'top-left': return `${base} top-4 left-4`;
      default: return `${base} bottom-4 right-4`;
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.sender === 'user';
    const isSystem = msg.type === 'system';
    
    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            {msg.avatar ? (
              <img src={msg.avatar} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                {msg.sender === 'bot' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
              </div>
            )}
          </div>
        )}
        
        <div className={`max-w-xs ${isUser ? 'order-1' : ''}`}>
          {!isUser && (
            <div className="text-xs text-gray-500 mb-1">{msg.senderName}</div>
          )}
          <div className={`
            rounded-lg px-3 py-2 text-sm
            ${isUser 
              ? 'bg-blue-500 text-white' 
              : msg.sender === 'bot'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-white border border-gray-200 text-gray-800'
            }
          `}>
            {msg.content}
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(msg.timestamp)}
            {isUser && msg.status && (
              <span className="ml-1">
                {msg.status === 'sending' && '⏳'}
                {msg.status === 'sent' && '✓'}
                {msg.status === 'delivered' && '✓✓'}
                {msg.status === 'read' && '✓✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className={getPositionClasses()}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 relative"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <Card className={`w-80 shadow-xl ${isMinimized ? 'h-auto' : 'h-96'}`}>
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-sm">Support Chat</CardTitle>
                {currentAgent && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${currentAgent.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {currentAgent.name} • {currentAgent.responseTime}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {messages.map(renderMessage)}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                    <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!message.trim()}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default LiveChatWidget;