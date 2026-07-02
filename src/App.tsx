import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./App.css";

type Message = {
  id: number;
  text: string;
  sender: "them" | "me";
  time: string;
  ghostType?: boolean;
};

const SCRIPT: Message[] = [
  { id: 1, text: "hey! are you free tonight?", sender: "them", time: "8:32 PM" },
  { id: 2, text: "yeah what's up", sender: "me", time: "8:32 PM" },
  { id: 3, text: "there's this new ramen spot on bedford ave", sender: "them", time: "8:33 PM" },
  { id: 4, text: "cant wait im in", sender: "me", time: "8:33 PM", ghostType: true },
  { id: 5, text: "lol i knew you'd be down. 8pm?", sender: "them", time: "8:34 PM" },
  { id: 6, text: "perfect, see you there", sender: "me", time: "8:34 PM" },
];

type KeyDef = { id: string; label: string; flex?: number };

const KEY_ROWS: KeyDef[][] = [
  "q w e r t y u i o p".split(" ").map((k) => ({ id: k, label: k })),
  "a s d f g h j k l".split(" ").map((k) => ({ id: k, label: k })),
  [
    { id: "shift", label: "\u21E7", flex: 1.5 },
    ...("z x c v b n m".split(" ").map((k) => ({ id: k, label: k }))),
    { id: "delete", label: "\u232B", flex: 1.5 },
  ],
  [
    { id: "123", label: "123", flex: 1.5 },
    { id: "space", label: "space", flex: 5 },
    { id: "return", label: "return", flex: 1.5 },
  ],
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
        {"\u2039"}
      </motion.span>
      <motion.div
        className="header-avatar"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 18 }}
      >
        {"\uD83E\uDDD1\u200D\uD83E\uDDB1"}
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

function Keyboard({ activeKey }: { activeKey: string | null }) {
  return (
    <motion.div
      className="keyboard"
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      {KEY_ROWS.map((row, rowIdx) => (
        <div className="key-row" key={rowIdx}>
          {row.map((key) => {
            const isActive = activeKey === key.id;
            const isSpecial = !!key.flex;
            return (
              <motion.div
                className={`key ${isSpecial ? "key-special" : "key-letter"}`}
                key={key.id}
                style={{ flex: key.flex || 1 }}
                animate={
                  isActive
                    ? { scale: 0.88, backgroundColor: "#ffffff", color: "#000000" }
                    : {
                        scale: 1,
                        backgroundColor: isSpecial ? "#363638" : "#58585c",
                        color: isSpecial ? "#aaaaaa" : "#ffffff",
                      }
                }
                transition={{ duration: 0.08 }}
              >
                {key.label}
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}

export default function App() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sendPressed, setSendPressed] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      while (!cancelled) {
        await sleep(800);

        for (const msg of SCRIPT) {
          if (cancelled) return;

          if (msg.ghostType) {
            // keyboard slides up
            setKeyboardVisible(true);
            await sleep(550);

            // ghost type each character
            for (const char of msg.text) {
              if (cancelled) return;
              const keyId = char === " " ? "space" : char.toLowerCase();
              setActiveKey(keyId);
              setTypedText((prev) => prev + char);
              await sleep(130);
              setActiveKey(null);
              await sleep(45);
            }

            // pause, then press send
            await sleep(500);
            setSendPressed(true);
            await sleep(180);
            setSendPressed(false);
            setVisibleMessages((prev) => [...prev, msg]);
            setTypedText("");
            await sleep(250);
            setKeyboardVisible(false);
            await sleep(450);
          } else if (msg.sender === "them") {
            setIsTyping(true);
            await sleep(900 + Math.random() * 400);
            if (cancelled) return;
            setIsTyping(false);
            setVisibleMessages((prev) => [...prev, msg]);
            await sleep(500);
          } else {
            await sleep(300);
            setVisibleMessages((prev) => [...prev, msg]);
            await sleep(700);
          }
        }

        // pause then reset
        await sleep(3000);
        setVisibleMessages([]);
        setTypedText("");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, isTyping, keyboardVisible, typedText]);

  return (
    <div className="app-bg">
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
          <div className="chat-body" ref={chatRef}>
            <AnimatePresence mode="popLayout">
              {visibleMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator key="typing" />}
          </div>
          <div className="chat-input-bar">
            <div className={`input-field ${typedText ? "has-text" : ""}`}>
              {typedText || "Message\u2026"}
            </div>
            <motion.div
              className={`send-btn ${typedText ? "active" : ""}`}
              animate={sendPressed ? { scale: 0.85 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {"\u2191"}
            </motion.div>
          </div>
          <AnimatePresence>
            {keyboardVisible && <Keyboard activeKey={activeKey} key="keyboard" />}
          </AnimatePresence>
          {!keyboardVisible && <div className="home-indicator" />}
        </div>
      </motion.div>
    </div>
  );
}
