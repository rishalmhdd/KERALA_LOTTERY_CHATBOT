import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  refId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Complaint", complaintSchema);
