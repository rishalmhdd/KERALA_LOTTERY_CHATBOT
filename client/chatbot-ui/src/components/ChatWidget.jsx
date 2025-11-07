import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiX } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import { sendChat } from "../api/chatService";
import ChatButton from "./ChatButton";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [faqMode, setFaqMode] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem("ksl_session");
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem("ksl_session", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: uuidv4(), from: "user", text, time: formatTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { id: "typing", from: "bot", text: "typing...", time: "" },
    ]);

    try {
      // ✅ send raw text if FAQ mode
      let msgToSend = faqMode ? text : text.toUpperCase();

      const data = await sendChat(sessionId, msgToSend);
      pushBotResponse(data);
    } catch {
      pushBotResponse({ reply: "⚠️ Server offline — try again later." });
    }
  }

  async function selectOption(value, index = null, label = null) {
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== "typing"),
      { id: "typing", from: "bot", text: "typing...", time: "" },
    ]);

    let val = value;

    // ✅ FAQ item button (no explicit value)
    if (!val && label?.startsWith("❓")) {
      val = `FAQ_${index}`;
    }

    // ✅ entering FAQ typing mode
    if (val === "FAQ_TYPING") {
      setFaqMode(true);
    }

    // ✅ leaving FAQ mode only when returning to menu or FAQ root
    if (["MENU", "FAQ"].includes(val)) {
      setFaqMode(false);
    }

    // ✅ uppercase only when NOT in FAQ typing
    if (!faqMode) val = val.toUpperCase();

    try {
      const data = await sendChat(sessionId, val);
      pushBotResponse(data);
    } catch {
      pushBotResponse({ reply: "⚠️ Something went wrong" });
    }
  }

  function pushBotResponse(data) {
    setMessages((prev) => prev.filter((m) => m.id !== "typing"));

    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        from: "bot",
        text: data.reply || "",
        time: formatTime(),
      },
    ]);

    if (data.buttons) {
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), from: "bot-options", options: data.buttons },
      ]);
    }

    setSending(false);
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatButton
            onClick={() => {
              setOpen(true);
              setTimeout(() => selectOption("MENU"), 200);
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-green-300 flex flex-col overflow-hidden z-50"
          >
            <div className="bg-[var(--ksl-green-light)] px-4 py-2 flex items-center justify-between border-b border-green-300">
              <span className="font-semibold text-black text-sm flex items-center gap-2">
                <span className="w-3 h-3 bg-green-700 rounded-full"></span>
                Kerala Lottery Support
              </span>
              <button className="text-black" onClick={() => setOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="p-3 h-96 flex flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-3">
                {messages.map((m) =>
                  m.from === "bot-options" ? (
                    <div key={m.id} className="flex flex-wrap gap-2 my-2">
                      {m.options.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => selectOption(btn.value, i, btn.label)}
                          className="bg-[var(--ksl-green)] text-white text-xs px-3 py-2 rounded-full shadow hover:bg-[var(--ksl-green-dark)] transition"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`${
                          m.from === "user"
                            ? "bg-white border border-gray-200"
                            : "bg-[var(--ksl-green)] text-black"
                        } max-w-[85%] px-3 py-2 rounded-lg shadow-sm`}
                      >
                        <div className="text-[13px] whitespace-pre-line">{m.text}</div>
                        {m.time && <div className="text-[10px] text-gray-600 text-right mt-1">{m.time}</div>}
                      </div>
                    </div>
                  )
                )}
              </div>

              <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--ksl-green-dark)] text-white shadow hover:scale-105 disabled:opacity-50"
                >
                  <FiSend />
                </button>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
