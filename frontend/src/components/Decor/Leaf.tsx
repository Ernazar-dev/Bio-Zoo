import React from 'react';

/** Minimal barg belgisi — brendning organik elementi */
export const Leaf: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 14,
  color = 'var(--accent)',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
    <path d="M21 3C10.5 3 3.5 10 3.5 20.5 14 20.5 21 13.5 21 3Z" fill={color} />
    <path d="M5.5 18.5C10 14 14.5 9.5 19 5" stroke="var(--surface, #fff)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** Konturli barg — bo'sh joylar va fon dekori uchun */
export const LeafOutline: React.FC<{ size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }> = ({
  size = 48,
  color = 'var(--accent)',
  strokeWidth = 1.2,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
    <path d="M21 3C10.5 3 3.5 10 3.5 20.5 14 20.5 21 13.5 21 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M5.5 18.5C10 14 14.5 9.5 19 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export default Leaf;
