export default function PulseMark({ width = 120, height = 28, color = "var(--color-pine)", strokeWidth = 2 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 14 H26 L31 4 L37 24 L42 14 H58 L63 20 L68 8 L73 14 H120"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}