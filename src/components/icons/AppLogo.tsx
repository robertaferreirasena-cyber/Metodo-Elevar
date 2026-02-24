import * as React from "react";

interface AppLogoProps {
  className?: string;
  size?: number;
}

const AppLogo = React.forwardRef<SVGSVGElement, AppLogoProps>(
  ({ className = "", size = 32 }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* iPhone-style rounded rectangle */}
        <defs>
          <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#D946EF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        
        {/* Phone body */}
        <rect
          x="4"
          y="1"
          width="24"
          height="30"
          rx="5"
          fill="url(#phoneGradient)"
        />
        
        {/* Screen bezel */}
        <rect
          x="6"
          y="4"
          width="20"
          height="24"
          rx="2"
          fill="rgba(255,255,255,0.1)"
        />
        
        {/* Star in center */}
        <path
          d="M16 7L17.8 12.4L23.5 12.4L18.8 15.8L20.6 21.2L16 17.8L11.4 21.2L13.2 15.8L8.5 12.4L14.2 12.4L16 7Z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Top notch/speaker */}
        <rect
          x="13"
          y="2.5"
          width="6"
          height="1"
          rx="0.5"
          fill="rgba(255,255,255,0.3)"
        />
        
        {/* Bottom indicator */}
        <rect
          x="12"
          y="27"
          width="8"
          height="1.5"
          rx="0.75"
          fill="rgba(255,255,255,0.4)"
        />
      </svg>
    );
  }
);

AppLogo.displayName = "AppLogo";

export { AppLogo };
