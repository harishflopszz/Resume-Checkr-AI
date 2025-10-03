import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@/hooks/useProgress";
import {
  FileSearch,
  Brain,
  PenTool,
  Sparkles,
  Zap,
  Layers
} from "lucide-react";
import { OptimizedResume } from "@/types/analysis";

type Step = {
  text: string;
  duration: number;
  icon: React.ElementType;
  color: string;
  progressRange: [number, number];
};

const BUILD_STEPS: Step[] = [
  { text: "Analyzing Resume", duration: 60000, icon: FileSearch, color: "#6366f1", progressRange: [0, 25] },
  { text: "Matching Keywords", duration: 90000, icon: Brain, color: "#8b5cf6", progressRange: [25, 50] },
  { text: "Scoring Analysis", duration: 60000, icon: PenTool, color: "#ec4899", progressRange: [50, 75] },
  { text: "Finalizing Results", duration: 60000, icon: Sparkles, color: "#f43f5e", progressRange: [75, 100] }
];

export interface BuildingResumeViewProps {
  onBack?: () => void;
  isLoading?: boolean;
  apiComplete?: boolean;
}

const ModernResumeBuilder: React.FC<BuildingResumeViewProps> = ({ onBack, isLoading = true, apiComplete = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [internalApiComplete, setInternalApiComplete] = useState(false);
  const progress = useProgress({ isLoading, duration: 30000, apiComplete: apiComplete || internalApiComplete });

  useEffect(() => {
    const stepIndex = BUILD_STEPS.findIndex(step => progress >= step.progressRange[0] && progress < step.progressRange[1]);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
  }, [progress]);

  // Simulate API completion when progress reaches 95%
  useEffect(() => {
    if (progress >= 95 && !apiComplete && !internalApiComplete) {
      const timer = setTimeout(() => {
        setInternalApiComplete(true);
      }, 3000 + Math.random() * 4000); // Random delay between 3-7 seconds to simulate realistic API response time

      return () => clearTimeout(timer);
    }
  }, [progress, apiComplete, internalApiComplete]);
  const currentStepData = BUILD_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Optimized floating particles - reduced from 15 to 6 for better performance */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`particle-${i}-${currentStep}`}
            className="absolute rounded-full"
            style={{
              width: `${6 + i * 2}px`,
              height: `${6 + i * 2}px`,
              background: `linear-gradient(45deg, ${currentStepData?.color}, ${BUILD_STEPS[(currentStep + 1) % BUILD_STEPS.length]?.color || currentStepData?.color})`,
              left: `${20 + i * 15}%`,
              top: `${20 + (i % 2) * 40}%`,
              opacity: 0.4,
            }}
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Main card */}
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white overflow-hidden h-[600px] w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-10 h-full flex flex-col justify-center">
            {/* Progress ring */}
            <div className="relative flex justify-center items-center mb-8">
              <svg width="200" height="200" className="transform -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke={currentStepData?.color}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress / 100) }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ transformOrigin: '100px 100px' }}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={currentStep}
                  className="mb-2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {currentStepData && React.createElement(currentStepData.icon, {
                    className: "w-10 h-10",
                    style: { color: currentStepData.color }
                  })}
                </motion.div>
                
                <motion.div
                  className="text-center"
                  key={Math.round(progress)}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl font-bold tabular-nums">
                    {Math.round(progress)}<span className="text-lg">%</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {currentStepData && `${currentStepData.progressRange[0]}-${currentStepData.progressRange[1]}%`}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Status text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                className="text-center mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentStepData?.text}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isLoading ? (
                    <>
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        ●
                      </motion.span>{" "}
                      Processing live data...
                    </>
                  ) : (
                    "✓ Complete!"
                  )}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: currentStepData?.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between">
              {BUILD_STEPS.map((step, index) => (
                <div key={`step-${step.text}-${index}`} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep
                      ? 'bg-indigo-100'
                      : 'bg-gray-100'
                  }`}>
                    {React.createElement(step.icon, {
                      className: `w-4 h-4 ${
                        index <= currentStep
                          ? 'text-indigo-600'
                          : 'text-gray-400'
                      }`,
                      style: { color: 'inherit' }
                    })}
                  </div>
                  <div className={`text-xs font-medium ${
                    index <= currentStep 
                      ? 'text-indigo-600' 
                      : 'text-gray-400'
                  }`}>
                    {step.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>



        {/* Optimized floating accent shapes */}
        {/* Live processing indicator */}
        <motion.div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20"
          style={{ backgroundColor: currentStepData?.color }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Simplified processing dots */}
        <motion.div
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentStepData?.color }}
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ModernResumeBuilder;
