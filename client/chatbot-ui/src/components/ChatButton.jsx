import { motion } from "framer-motion";
import mascot from "../assets/mascot-copy.png"

export default function ChatButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        w-20 h-20 rounded-full
        bg-green-400 shadow-xl
        flex items-center justify-center
        relative overflow-hidden
      "
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {/* Mascot */}
      <img src={mascot} alt="chat icon" className="w-14 h-14 object-contain" />

      {/* "Hi" bubble */}
      <div className="
        absolute -top-1 -right-1
        bg-white text-green-700 font-semibold text-xs
        px-2 py-0.5 rounded-full border border-green-300 shadow-sm
      ">
        Hi!
      </div>

      {/* online dots */}
      <div className="absolute bottom-1 left-1 flex gap-1">
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
      </div>
    </motion.button>
  );
}
