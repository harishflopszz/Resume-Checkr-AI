import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export function CurrentStepText({
  text,
  isComplete,
}: {
  text: string;
  isComplete: boolean;
}) {
  return (
  return (
    <div
      className="text-center min-h-[50px] md:min-h-[60px] mb-6 md:mb-7 px-4"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.p
          className="text-base md:text-lg font-semibold text-gray-800"
          key={text}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
        >
          {isComplete ? "Your resume is ready!" : text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
  );
}









