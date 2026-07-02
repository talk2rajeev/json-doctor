import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Key, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import bcrypt from 'bcryptjs';
import Button from './Button';
import { openaiService } from '../services/openaiService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatInterfaceProps {
  source: 'editor' | 'compare';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ source }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for existing key (we check the raw key now for usage)
    const storedKey = sessionStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeySet(true);
    } else {
      // Fallback to check hash if we want to show "key set" state but force re-entry for usage?
      // For now, let's just rely on the raw key for simplicity as requested.
      const storedHash = sessionStorage.getItem('openai_api_key_hash');
      if (storedHash) {
        // We have a hash but not the key (maybe from previous session where we only stored hash).
        // We can't use it, so we prompt user again.
        setIsKeySet(false);
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading, isExpanded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      // Store raw key for API usage
      sessionStorage.setItem('openai_api_key', apiKey);
      
      // Keep storing hash for "security" theater if desired, or just consistency
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(apiKey, salt);
      sessionStorage.setItem('openai_api_key_hash', hash);
      
      setIsKeySet(true);
    }
  };

  const getContextContent = () => {
    if (source === 'editor') {
      const content = sessionStorage.getItem('json-editor-content');
      return content ? `Current JSON Editor Content:\n\`\`\`json\n${content}\n\`\`\`` : 'No JSON content in editor.';
    } else if (source === 'compare') {
      const original = sessionStorage.getItem('json-diff-original');
      const modified = sessionStorage.getItem('json-diff-modified');
      return `Original JSON:\n\`\`\`json\n${original || 'null'}\n\`\`\`\n\nModified JSON:\n\`\`\`json\n${modified || 'null'}\n\`\`\``;
    }
    return '';
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare messages with context
      const context = getContextContent();
      const systemMessage: Message = {
        role: 'system',
        content: `You are a helpful AI assistant for a JSON editor tool. 
        The user is asking questions about JSON data.
        
        Context:
        ${context}
        
        Answer the user's question based on this context if applicable.`
      };

      // Filter out previous system messages to avoid duplication if we were to keep full history
      // For this simple implementation, we'll construct the conversation for the API call
      // consisting of the system message + recent history.
      
      const apiMessages = [
        systemMessage,
        ...messages.filter(m => m.role !== 'system'), // existing history
        userMessage // current message
      ];

      // Create a placeholder message for the assistant
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: '' 
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const stream = openaiService.generateChatCompletionStream(
        apiKey,
        apiMessages
      );

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullContent;
          }
          return newMessages;
        });
      }

    } catch (error: any) {
      console.error('Chat Error:', error);
      
      let errorMsg = error.message || 'Failed to get response from OpenAI';
      
      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        errorMsg = 'You have exceeded your OpenAI API quota. Please check your billing details at platform.openai.com.';
      }

      // If we started streaming (last message is assistant), append error or replace?
      // Better to add a new error message if the stream failed mid-way, or update if empty.
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'assistant' && !lastMsg.content) {
          // If empty assistant message, replace it with error
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: `Error: ${errorMsg}` };
          return newMessages;
        } else {
          // Otherwise append error message
          return [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }];
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearKey = () => {
    sessionStorage.removeItem('openai_api_key');
    sessionStorage.removeItem('openai_api_key_hash');
    setApiKey('');
    setIsKeySet(false);
    setMessages([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div 
          className={`mb-4 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200 ease-in-out ${
            isExpanded ? 'w-[60rem] max-w-[90vw] h-[80vh]' : 'w-[38rem] h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold flex items-center">
              <MessageSquare size={18} className="mr-2" />
              AI Assistant
            </h3>
            <div className="flex items-center space-x-2">
              {isKeySet && (
                <button 
                  onClick={handleClearKey}
                  className="text-blue-100 hover:text-white transition-colors text-xs bg-blue-700 px-2 py-1 rounded mr-2"
                  title="Clear API Key"
                >
                  Reset Key
                </button>
              )}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-100 hover:text-white transition-colors mr-1"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {!isKeySet ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Key size={24} className="text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Enter OpenAI API Key</h4>
                <p className="text-sm text-gray-500 mb-4">
                  To start chatting, please enter your OpenAI API key. It will be stored locally in your browser session.
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <Button 
                  label="Save Key" 
                  onClick={handleSaveKey} 
                  variant="blue" 
                  className="w-full"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <p>👋 Hi there! I have context of your JSON data. How can I help?</p>
                  </div>
                )}
                {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {isKeySet && (
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full ${
                    input.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatInterface;
