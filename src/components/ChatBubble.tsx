import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithCat } from '../utils/llm';

interface ChatBubbleProps {
  onInteract: () => void;
}

export function ChatBubble({ onInteract }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'cat', text: string }[]>([
    { role: 'cat', text: '喵~ 找我玩吗？' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    onInteract();
    
    const reply = await chatWithCat(userMsg);
    setMessages(prev => [...prev, { role: 'cat', text: reply }]);
    setLoading(false);
  };

  return (
    <div className="absolute bottom-[260px] left-[50%] -translate-x-[50%] w-64">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl mb-4 pointer-events-auto"
            onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
            onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
          >
            <div className="h-40 overflow-y-auto flex flex-col gap-2 mb-3 no-scrollbar text-sm">
              {messages.map((msg, i) => (
                <div key={i} className={`px-3 py-2 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-100 self-end rounded-br-none' : 'bg-gray-100 self-start rounded-bl-none'}`}>
                  {msg.text}
                </div>
              ))}
              {loading && <div className="text-gray-400 text-xs self-start">猫咪正在思考...</div>}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm outline-none"
                placeholder="跟猫咪说点什么..."
              />
              <button 
                onClick={handleSend}
                className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-medium"
              >
                发送
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mx-auto block bg-white/80 hover:bg-white shadow-lg p-2 rounded-full pointer-events-auto transition-colors"
        onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
      >
        💬
      </button>
    </div>
  );
}
