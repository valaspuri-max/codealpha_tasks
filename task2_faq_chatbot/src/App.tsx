import { useState, useRef, useEffect } from 'react';
import { Bot, Send, MessageCircle } from 'lucide-react';
import { faqs } from '@/faqs';
import { buildFaqModel, matchFAQ } from '@/tfidf';
import type { Message } from '@/types';

const WELCOME =
  'Hi! I can help with admissions, courses, fees, hostels, exams, and campus life.';

const SUGGESTED = ['How do I apply?', 'How can I pay fees?', 'Is hostel available?'];

const FALLBACK =
  'I couldn\u2019t find a close answer. Please try asking about admissions, courses, fees, hostels, exams, or placements.';

const SIMILARITY_THRESHOLD = 0.15;

// Build the TF-IDF model once at module load.
buildFaqModel(faqs);

let idCounter = 0;
const makeId = () => `${Date.now()}-${idCounter++}`;

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: 'bot', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: makeId(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const result = matchFAQ(trimmed);
      const isMatch = result.faq !== null && result.similarity >= SIMILARITY_THRESHOLD;
      const reply: Message = isMatch
        ? {
            id: makeId(),
            role: 'bot',
            text: result.faq!.answer,
            matchedQuestion: result.faq!.question,
            similarity: result.similarity,
          }
        : {
            id: makeId(),
            role: 'bot',
            text: FALLBACK,
            similarity: result.similarity,
          };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 550);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="min-h-screen bg-[#f3effb] flex flex-col items-center px-3 py-6 sm:py-10">
      <div className="w-full max-w-2xl flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-purple-100 px-5 py-4 flex items-center gap-3">
          <div className="bg-purple-600 rounded-xl p-2.5 shadow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">KITSW</h1>
            <p className="text-xs text-purple-500 font-medium">College FAQ Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Online
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="bg-white flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4 border-x border-purple-100 min-h-[300px] max-h-[60vh]"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="bg-purple-100 rounded-xl p-1.5">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-purple-50 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </div>
            </div>
          )}

          {/* Suggested buttons only while at welcome state */}
          {messages.length === 1 && !isTyping && (
            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-2 font-medium">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium px-3.5 py-2 rounded-full border border-purple-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-2xl shadow-sm border border-purple-100 border-t-0 px-3 sm:px-4 py-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about admissions, courses, fees…"
            className="flex-1 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400 rounded-full px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-purple-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Quick topic chips */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {['Admissions', 'Courses', 'Fees', 'Hostel', 'Exams', 'Placements'].map((t) => (
            <button
              key={t}
              onClick={() => send(t)}
              className="text-xs text-purple-600 hover:text-purple-800 bg-white/60 hover:bg-white border border-purple-200 px-3 py-1.5 rounded-full transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          {faqs.length} FAQs available · TF-IDF + Cosine Similarity · Runs in your browser
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const hasMeta = !isUser && msg.matchedQuestion !== undefined;
  const similarityPct =
    msg.similarity !== undefined ? Math.round(msg.similarity * 100) : 0;

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`rounded-xl p-1.5 shrink-0 ${
          isUser ? 'bg-purple-600' : 'bg-purple-100'
        }`}
      >
        {isUser ? (
          <MessageCircle className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-purple-600" />
        )}
      </div>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-purple-600 text-white rounded-2xl rounded-br-md'
            : 'bg-purple-50 text-gray-800 rounded-2xl rounded-bl-md'
        }`}
      >
        <p>{msg.text}</p>

        {/* Matched FAQ question + similarity percentage (demonstration) */}
        {hasMeta && (
          <div className="mt-2 pt-2 border-t border-purple-200/60 text-xs text-purple-600 space-y-0.5">
            <p>
              <span className="font-semibold">Matched FAQ:</span> {msg.matchedQuestion}
            </p>
            <p>
              <span className="font-semibold">Similarity:</span> {similarityPct}%
            </p>
          </div>
        )}

        {/* Show similarity even on fallback for demonstration */}
        {!isUser && !hasMeta && msg.similarity !== undefined && (
          <div className="mt-2 pt-2 border-t border-purple-200/60 text-xs text-gray-400">
            <p>
              <span className="font-semibold">Best similarity:</span> {similarityPct}%
              (below {Math.round(SIMILARITY_THRESHOLD * 100)}% threshold)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

export default App;
