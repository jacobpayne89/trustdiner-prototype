import React from 'react';

export interface IconProps {
  size?: number | string;
  className?: string;
  color?: string;
  title?: string;
  viewBox?: string;
}

export const BaseIcon: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 24,
  className = '',
  color = 'currentColor',
  title,
  viewBox = "0 0 24 24",
  children,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}; 