import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { chatWithCat } from '../utils/llm';

interface ChatBubbleProps {
  onInteract: () => void;
}

export function ChatBubble({ onInteract }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'cat'; text: string }[]>([
    { role: 'cat', text: '喵，找我玩吗？' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    onInteract();

    const reply = await chatWithCat(userMsg);
    setMessages((prev) => [...prev, { role: 'cat', text: reply }]);
    setLoading(false);
  };

  return (
    <div className="absolute bottom-[260px] left-1/2 w-72 -translate-x-1/2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4 rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur-sm pointer-events-auto"
            onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
            onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
          >
            <div className="mb-3 flex h-40 flex-col gap-2 overflow-y-auto text-sm">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    msg.role === 'user' ? 'self-end bg-blue-100 text-slate-900' : 'self-start bg-gray-100 text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && <div className="self-start text-xs text-gray-400">小猫正在思考...</div>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                className="min-w-0 flex-1 rounded-full bg-gray-100 px-3 py-1 text-sm outline-none"
                placeholder="跟小猫说点什么..."
              />
              <button onClick={handleSend} className="rounded-full bg-blue-500 p-2 text-white" title="发送">
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mx-auto block rounded-full bg-white/90 p-3 shadow-lg transition-colors hover:bg-white pointer-events-auto"
        onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
        title="聊天"
      >
        <MessageCircle size={18} />
      </button>
    </div>
  );
}
