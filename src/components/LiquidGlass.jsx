import React from 'react';

/**
 * iOS Liquid Glass Button Component
 * Implements the iOS liquid glass morphism design style
 */
export const LiquidGlassButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'dark', // 'dark' | 'light'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  icon = null,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-14 h-14 p-3',
  };

  const variantClasses = {
    dark: 'glass-morphism-dark liquid-shadow-dark',
    light: 'glass-morphism liquid-shadow',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        flex items-center justify-center
        liquid-button
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:brightness-110
        ${className}
      `}
      {...props}
    >
      {icon && <div className="w-5 h-5">{icon}</div>}
      {children}
    </button>
  );
};

/**
 * iOS Liquid Glass Card Component
 */
export const LiquidGlassCard = ({
  children,
  variant = 'dark',
  className = '',
  ...props
}) => {
  const variantClasses = {
    dark: 'glass-morphism-dark',
    light: 'glass-morphism',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        rounded-2xl
        p-4
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * iOS Liquid Glass Icon Button with Chevron
 */
export const LiquidGlassChevronButton = ({
  direction = 'left', // 'left' | 'right' | 'up' | 'down'
  onClick,
  variant = 'dark',
  ...props
}) => {
  const rotationClasses = {
    left: 'rotate-180',
    right: 'rotate-0',
    up: '-rotate-90',
    down: 'rotate-90',
  };

  return (
    <LiquidGlassButton
      onClick={onClick}
      variant={variant}
      size="md"
      {...props}
    >
      <svg
        className={`w-5 h-5 ${rotationClasses[direction]} transition-transform`}
        fill="none"
        stroke="rgba(252, 250, 247, 1)"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </LiquidGlassButton>
  );
};

/**
 * iOS Liquid Glass Text Button
 */
export const LiquidGlassTextButton = ({
  children,
  onClick,
  variant = 'dark',
  className = '',
  ...props
}) => {
  const variantClasses = {
    dark: 'glass-morphism-dark liquid-shadow-dark',
    light: 'glass-morphism liquid-shadow',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${variantClasses[variant]}
        px-5 py-3
        rounded-full
        liquid-button
        active:scale-95
        hover:brightness-110
        text-white text-sm font-bold uppercase
        tracking-wide
        ${className}
      `}
      style={{
        fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * iOS Liquid Glass Container with blur background
 */
export const LiquidGlassContainer = ({
  children,
  variant = 'dark',
  blur = 'xl', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  opacity = 20, // 10-50
  className = '',
  ...props
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
    '3xl': 'backdrop-blur-3xl',
  };

  const bgColor = variant === 'dark'
    ? `rgba(0, 0, 0, ${opacity / 100})`
    : `rgba(255, 255, 255, ${opacity / 100})`;

  return (
    <div
      className={`
        ${blurClasses[blur]}
        border border-white/10
        ${className}
      `}
      style={{
        backgroundColor: bgColor,
        WebkitBackdropFilter: `blur(${blur === 'xl' ? '20px' : '30px'})`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  Button: LiquidGlassButton,
  Card: LiquidGlassCard,
  ChevronButton: LiquidGlassChevronButton,
  TextButton: LiquidGlassTextButton,
  Container: LiquidGlassContainer,
};
