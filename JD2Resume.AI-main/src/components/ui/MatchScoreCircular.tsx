
import React, { useEffect, useState } from 'react';

interface MatchScoreCircularProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const MatchScoreCircular: React.FC<MatchScoreCircularProps> = ({
  score,
  size = 200,
  strokeWidth = 16,
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const scoreColor =
    score < 40 ? 'text-red-600' : score < 70 ? 'text-blue-600' : 'text-green-600';
  
// At the top of the file
import React, { useEffect, useState, useId } from 'react';

 const MatchScoreCircular: React.FC<MatchScoreCircularProps> = ({
   score,
   size = 200,
   strokeWidth = 16,
 }) => {
  const uniqueId = useId();
   const [displayScore, setDisplayScore] = useState(0);
   
   // ... radius, circumference, offset ...

  const scoreGradientId = `scoreGradient-${uniqueId}`;
   const scoreGradientColor =
     score < 40 ? '#DC2626' : score < 70 ? '#2563EB' : '#059669';

   // ...
 };

  useEffect(() => {
    let animationFrameId: number;
    const animateScore = (timestamp: number) => {
      if (displayScore < score) {
        setDisplayScore(prev => Math.min(prev + 1, score));
        animationFrameId = requestAnimationFrame(animateScore);
      }
    };
    animationFrameId = requestAnimationFrame(animateScore);
    return () => cancelAnimationFrame(animationFrameId);
  }, [score]);
  
  useEffect(() => {
    setDisplayScore(0); // Reset immediately
    const startTime = performance.now();
    const duration = 1500;
    let animationFrameId: number;

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(progress * score));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateScore);
      }
    };

    animationFrameId = requestAnimationFrame(animateScore);
    return () => cancelAnimationFrame(animationFrameId);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
            <linearGradient id={scoreGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={scoreGradientColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={scoreGradientColor} stopOpacity="1" />
            </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${scoreGradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className={`absolute flex flex-col items-center ${scoreColor}`}>
        <span className="text-4xl md:text-5xl font-bold tracking-tighter">{Math.round(displayScore)}</span>
        <span className="text-base md:text-lg font-medium text-muted-foreground">% Match</span>
      </div>
    </div>
  );
};

export default MatchScoreCircular;
