export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function sendChat(sessionId, message) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Network Error");
  }

  return res.json();
}
