// src/components/ChatWidget.tsx
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatWidgetProps {
  visitorId?: string;
  vehicle?: { year: number; make: string; model: string };
  intent?: string;
  recommendations?: any[];
}

export default function ChatWidget({ visitorId, vehicle, intent, recommendations }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Connect WebSocket when widget opens
  useEffect(() => {
    if (!isOpen || wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send initial context if available
      if (vehicle) {
        ws.send(JSON.stringify({
          type: 'rpc',
          method: 'setVehicle',
          args: [vehicle],
        }));
      }
      if (intent) {
        ws.send(JSON.stringify({
          type: 'rpc',
          method: 'setIntent',
          args: [intent],
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: data.id || crypto.randomUUID(),
            role: data.role,
            content: data.content,
            createdAt: new Date(),
          }]);
          setIsLoading(false);
        } else if (data.type === 'stream') {
          // Handle streaming - append to last assistant message
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: last.content + data.content }];
            }
            return [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: data.content,
              createdAt: new Date(),
            }];
          });
        } else if (data.type === 'stream_end') {
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isOpen, vehicle, intent]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || !isConnected) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      content: input.trim(),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-circle fixed bottom-6 right-6 z-50 w-14 h-14 shadow-lg ${isOpen ? 'btn-neutral' : 'btn-primary'}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] card bg-base-100 shadow-2xl flex flex-col overflow-hidden" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-primary text-primary-content px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">AI Fitment Expert</h3>
              <p className="text-xs opacity-80">
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200">
            {messages.length === 0 && (
              <div className="text-center text-base-content/60 py-8">
                <p className="text-sm">Hi! I'm your AI fitment expert.</p>
                <p className="text-xs mt-2">Ask me anything about wheel and tire setups!</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-primary text-primary-content' : ''}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat chat-start">
                <div className="chat-bubble">
                  <span className="loading loading-dots loading-sm"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-base-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={!isConnected}
                className="input input-bordered w-full text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !isConnected || isLoading}
                className="btn btn-primary btn-square"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
