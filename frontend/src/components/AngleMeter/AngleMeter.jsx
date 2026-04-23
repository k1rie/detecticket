import styles from './AngleMeter.module.css';

export default function AngleMeter({ angleDeg = 0, similarity = 0, status = 'different' }) {
  const maxDeg = 90;
  const clampedDeg = Math.min(angleDeg, maxDeg);
  const fillPercent = ((maxDeg - clampedDeg) / maxDeg) * 100;

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (fillPercent / 100) * (circumference * 0.75);

  const colorMap = {
    duplicate: '#e05c6e',
    related:   '#c9813d',
    different: '#5aaa7a',
  };

  const color = colorMap[status] || colorMap.different;

  return (
    <div className={styles.meter}>
      <svg viewBox="0 0 120 120" className={styles.svg}>
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="7"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={circumference * 0.375}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
        />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={dashOffset + circumference * 0.375}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 5px ${color}70)`,
          }}
        />
        <text x="60" y="56" textAnchor="middle" className={styles.value} fill={color}>
          {similarity.toFixed(1)}%
        </text>
        <text x="60" y="72" textAnchor="middle" className={styles.meterLabel} fill="rgba(255,255,255,0.3)">
          similitud
        </text>
      </svg>

      <div className={styles.info}>
        <div className={styles.formula}>
          θ = arccos(
          <span className={styles.highlight}>&lt;u,v&gt;</span>
          &nbsp;/&nbsp;
          <span className={styles.highlight}>‖u‖·‖v‖</span>
          )
        </div>
        <div className={styles.degRow}>
          <span className={styles.degValue}>{angleDeg.toFixed(2)}°</span>
          <span className={styles.degLabel}>ángulo</span>
        </div>
      </div>
    </div>
  );
}
