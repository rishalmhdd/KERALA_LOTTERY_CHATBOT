import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",                    // local dev
    "https://kerala-lottery-chatbot.vercel.app" // deployed frontend
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

connectDB();

app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("✅ Kerala Lottery Chatbot Backend Running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend is working fine 🚀",
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
