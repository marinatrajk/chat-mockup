import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./App.css";

type Message = {
  id: number;
  text: string;
  sender: "them" | "me";
  time: string;
};

const SCRIPT: Message[] = [
  { id: 1, text: "hey! are you free tonight?", sender: "them", time: "8:32 PM" },
  { id: 2, text: "yeah what's up", sender: "me", time: "8:32 PM" },
  { id: 3, text: "there's this new ramen spot on bedford ave", sender: "them", time: "8:33 PM" },
  { id: 4, text: "say less 🍜 i'm in", sender: "me", time: "8:33 PM" },
  { id: 5, text: "lol i knew you'd be down. 8pm?", sender: "them", time: "8:34 PM" },
  { id: 6, text: "perfect, see you there", sender: "me", time: "8:34 PM" },
];

function StatusBar() {
  return (
    <div className="status-bar">
      <span className="status-time">8:32</span>
      <div className="status-icons">
        <span className="signal-dot" />
        <span className="signal-dot" />
        <span className="signal-dot" />
        <span className="signal-dot dim" />
        <span className="battery">93%</span>
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="chat-header">
      <motion.span
        className="back-arrow"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        ‹
      </motion.span>
      <motion.div
        className="header-avatar"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 18 }}
      >
        🧑‍🦱
      </motion.div>
      <div className="header-info">
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Alex
        </motion.h2>
        <motion.div
          className="header-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="online-pulse" />
          online
        </motion.div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className="message-row them"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
    >
      <div className="bubble typing-bubble">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="typing-dot"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isMe = message.sender === "me";
  return (
    <motion.div
      className={`message-row ${message.sender}`}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <motion.div
        className={`bubble ${isMe ? "me" : "them"}`}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <span className="bubble-text">{message.text}</span>
        <span className="bubble-time">{message.time}</span>
      </motion.div>
    </motion.div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="phone-frame"
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="phone-notch" />
      <div className="phone-screen">
        <StatusBar />
        <ChatHeader />
        <div className="chat-body">{children}</div>
        <div className="chat-input-bar">
          <div className="input-field">Message…</div>
          <motion.div
            className="send-btn"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
          >
            ↑
          </motion.div>
        </div>
        <div className="home-indicator" />
      </div>
    </motion.div>
  );
}

export default function App() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const runSequence = () => {
      const step = () => {
        const idx = seqRef.current;

        if (idx >= SCRIPT.length) {
          // pause, then reset
          timeouts.push(
            setTimeout(() => {
              setVisibleMessages([]);
              seqRef.current = 0;
              timeouts.push(setTimeout(runSequence, 1200));
            }, 3000)
          );
          return;
        }

        const next = SCRIPT[idx];
        const delay = next.sender === "them" ? 600 : 300;

        // typing indicator before "them" messages
        if (next.sender === "them") {
          setIsTyping(true);
          timeouts.push(
            setTimeout(() => {
              setIsTyping(false);
              setVisibleMessages((prev) => [...prev, next]);
              seqRef.current = idx + 1;
              timeouts.push(setTimeout(step, 500));
            }, 900 + Math.random() * 400)
          );
        } else {
          setIsTyping(false);
          timeouts.push(
            setTimeout(() => {
              setVisibleMessages((prev) => [...prev, next]);
              seqRef.current = idx + 1;
              timeouts.push(setTimeout(step, 700));
            }, delay)
          );
        }
      };

      timeouts.push(setTimeout(step, 800));
    };

    runSequence();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, isTyping]);

  return (
    <div className="app-bg">
      <PhoneFrame>
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        {isTyping && <TypingIndicator key="typing" />}
      </PhoneFrame>
    </div>
  );
}
