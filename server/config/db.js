import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/lotterybot");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.log("❌ DB Connection Error", err);
  }
};

export default connectDB;
