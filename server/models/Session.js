import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  state: { type: String, default: "menu" },
  data: Object,
  createdAt: { type: Date, default: Date.now },
  language: { type: String, default: "EN" }

});

export default mongoose.model("Session", sessionSchema);
