import React from "react";

import React from "react";

type HeaderLogoProps = {
  size?: number;
  className?: string;
  showHome?: boolean;
};
  
const HeaderLogo: React.FC<HeaderLogoProps> = ({
  size = 40,
  className = "",
  showHome = true,
}) => {
  // …rest of component…
};

export default HeaderLogo;

type HeaderLogoProps = {
  size?: number;
  className?: string;
  showHome?: boolean;
};

const HeaderLogo: React.FC<HeaderLogoProps> = ({ size = 40, className = "", showHome = true }) => {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* Logo and Text */}
      <img
        src="/image-1.png"
        alt="JD2Resume AI Logo"
        width={size}
        height={size}
        className="rounded-lg sm:rounded-xl shadow-md bg-white/80"
        style={{ objectFit: 'contain' }}
      />
      <span className="font-extrabold text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
        JD2Resume AI
      </span>
    </div>
  );
};

export default HeaderLogo;
