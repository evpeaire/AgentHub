interface QualityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function QualityBadge({ score, size = 'md' }: QualityBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 4) return '#34d399';
    if (s >= 3) return '#fbbf24';
    if (s >= 2) return '#fb923c';
    return '#f87171';
  };

  const color = getColor(score);

  return (
    <div className={`quality-badge quality-badge-${size}`} title="Automated Quality Score">
      <svg viewBox="0 0 36 36" className="quality-ring">
        <circle
          cx="18" cy="18" r="15.91"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="18" cy="18" r="15.91"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${(score / 5) * 100} ${100 - (score / 5) * 100}`}
          strokeDashoffset="25"
          strokeLinecap="round"
        />
      </svg>
      <span className="quality-score" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
}
