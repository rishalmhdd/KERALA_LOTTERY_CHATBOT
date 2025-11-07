import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendChat } from "../api/chatService";

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function useChat() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let sid = localStorage.getItem("ksl_session");
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem("ksl_session", sid);
    }
    setSessionId(sid);
  }, []);

  async function sendMessage(text) {
    // add user message
    setMessages(prev => [...prev, { id: uuidv4(), from: "user", text, time: formatTime() }]);
    setSending(true);

    // typing
    setMessages(prev => [...prev, { id: "typing", from: "bot", text: "typing..." }]);

    try {
      const data = await sendChat(sessionId, text);

      // remove typing
      setMessages(prev => prev.filter(m => m.id !== "typing"));

      // bot reply
      setMessages(prev => [...prev, { id: uuidv4(), from: "bot", text: data.reply, time: formatTime() }]);

      // buttons
      if (data.buttons) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          from: "bot-options",
          options: data.buttons
        }]);
      }

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      setMessages(prev => [...prev, {
        id: uuidv4(),
        from: "bot",
        text: "❌ Cannot connect to server",
        time: formatTime()
      }]);
    }

    setSending(false);
  }

  function selectOption(value) {
    sendMessage(value);
  }

  return { messages, sendMessage, selectOption, sending };
}
