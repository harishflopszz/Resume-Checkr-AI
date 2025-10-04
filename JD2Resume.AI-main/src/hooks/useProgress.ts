import { useState, useEffect, useRef } from 'react';

type UseProgressProps = {
  isLoading: boolean;
  duration?: number;
  apiComplete?: boolean;
};

export const useProgress = ({ isLoading, duration = 25000, apiComplete = false }: UseProgressProps) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let targetProgress = 95; // Default target is 95%

        if (apiComplete) {
          targetProgress = 100; // If API is complete, go to 100%
        }

        // Calculate progress based on elapsed time
        const calculatedProgress = Math.min(
          (elapsed / duration) * targetProgress,
          targetProgress
        );

        // Only update if progress changed significantly (>0.5%) to reduce re-renders
        setProgress(prev => {
          if (Math.abs(prev - calculatedProgress) > 0.5) {
            return calculatedProgress;
          }
          return prev;
        });

        // If we've reached 100%, clear the interval
        if (apiComplete && calculatedProgress >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 300); // Reduced frequency from 200ms to 300ms for better performance

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Not loading, set to 100%
      setProgress(100);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isLoading, apiComplete, duration]);

  return progress;
};
