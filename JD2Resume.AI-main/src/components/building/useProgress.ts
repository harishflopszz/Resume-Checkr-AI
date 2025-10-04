import { useEffect, useMemo, useState } from "react";
import type { StepDefinition } from "./steps";

export function useProgress(steps: StepDefinition[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const totalDurationMs = useMemo(
    () => steps.reduce((sum, step) => sum + step.duration, 0),
    [steps]
  );

  const etaSeconds = useMemo(
    () => Math.max(0, Math.round(((100 - progress) / 100) * (totalDurationMs / 1000))),
    [progress, totalDurationMs]
  );

  useEffect(() => {
    let stepTimeout: ReturnType<typeof setTimeout> | null = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let completionTimeout: ReturnType<typeof setTimeout> | null = null;

    if (currentStepIndex < steps.length) {
      const currentStep = steps[currentStepIndex];

      const INTERVAL_MS = 50;
      const prevTarget = (currentStepIndex / steps.length) * 100;
      const targetProgress = ((currentStepIndex + 1) / steps.length) * 100;
      const ticks = Math.max(1, Math.round(currentStep.duration / INTERVAL_MS));
      const increment = (targetProgress - prevTarget) / ticks;
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newValue = prev + increment;
          if (newValue >= targetProgress) {
            if (progressInterval) clearInterval(progressInterval);
            return targetProgress;
          }
          return newValue;
        });
      }, INTERVAL_MS);

      stepTimeout = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, currentStep.duration);
    } else if (currentStepIndex === steps.length && !isComplete) {
      setProgress(100);
      completionTimeout = setTimeout(() => setIsComplete(true), 500);
    }

    return () => {
      if (stepTimeout) clearTimeout(stepTimeout);
      if (progressInterval) clearInterval(progressInterval);
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  }, [currentStepIndex, isComplete, steps]);

    return () => {
      if (stepTimeout) clearTimeout(stepTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [currentStepIndex, isComplete, steps]);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    progress,
    isComplete,
    totalDurationMs,
    etaSeconds,
  } as const;
}







