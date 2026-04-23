import styles from './VectorChart.module.css';

export const STATUS_COLOR = {
  duplicate: '#f06072',
  related:   '#e0924a',
  different: '#5cbd82',
};

function arrowPts(x1, y1, x2, y2, s = 6.5) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return [
    [x2, y2],
    [x2 - s * Math.cos(a - 0.42), y2 - s * Math.sin(a - 0.42)],
    [x2 - s * Math.cos(a + 0.42), y2 - s * Math.sin(a + 0.42)],
  ].map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
}

// 2-vector chart: Vector A along x-axis, Vector B at angle θ
export default function VectorChart({ analysis, width = 340, height = 240 }) {
  const { angle, angleDeg, similarity, status, thresholds } = analysis;
  const col  = STATUS_COLOR[status] ?? '#5cbd82';
  const colA = 'rgba(196,168,130,0.95)';
  const colB = 'rgba(220,212,202,0.9)';

  const W = width, H = height;
  const ox = Math.round(W * 0.26), oy = Math.round(H * 0.70);
  const len = Math.round(Math.min(W, H) * 0.48);

  const ax = ox + len, ay = oy;
  const bx = ox + len * Math.cos(angle);
  const by = oy - len * Math.sin(angle);

  const arcR  = Math.round(len * 0.43);
  const arcEx = ox + arcR * Math.cos(angle);
  const arcEy = oy - arcR * Math.sin(angle);
  const largeArc = angle > Math.PI ? 1 : 0;

  const midA = angle / 2;
  const lblR  = arcR + 17;
  const lblX  = ox + lblR * Math.cos(midA);
  const lblY  = oy - lblR * Math.sin(midA);

  const dupAngle = thresholds?.duplicate ?? 0.3;
  const relAngle = thresholds?.related   ?? 0.8;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Reference circles */}
      {[0.38, 0.68, 1].map((r, i) => (
        <circle key={i} cx={ox} cy={oy} r={len * r}
          fill="none" stroke="rgba(255,255,255,0.035)"
          strokeWidth="1" strokeDasharray="2 5" />
      ))}

      {/* Threshold lines */}
      {[[dupAngle, 'rgba(240,96,114,0.22)'], [relAngle, 'rgba(224,146,74,0.2)']].map(([a, c], i) => (
        <line key={i}
          x1={ox} y1={oy}
          x2={(ox + (len + 14) * Math.cos(a)).toFixed(2)}
          y2={(oy - (len + 14) * Math.sin(a)).toFixed(2)}
          stroke={c} strokeWidth="1" strokeDasharray="3 3" />
      ))}

      {/* Angle sector */}
      <path
        d={`M ${ox} ${oy} L ${ox + arcR} ${oy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEx.toFixed(2)} ${arcEy.toFixed(2)} Z`}
        fill={col} fillOpacity="0.08" />

      {/* Angle arc */}
      <path
        d={`M ${ox + arcR} ${oy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEx.toFixed(2)} ${arcEy.toFixed(2)}`}
        fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.75"
        className={styles.arcDraw} />

      {/* Horizontal axis */}
      <line x1={ox - 8} y1={oy} x2={ox + len + 22} y2={oy}
        stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Vector A */}
      <line x1={ox} y1={oy} x2={ax} y2={ay}
        stroke={colA} strokeWidth="2.2" strokeLinecap="round"
        className={styles.vecDraw} />
      <polygon points={arrowPts(ox, oy, ax, ay)} fill={colA}
        className={styles.arrowFade} />

      {/* Vector B */}
      <line x1={ox} y1={oy} x2={bx.toFixed(2)} y2={by.toFixed(2)}
        stroke={colB} strokeWidth="2.2" strokeLinecap="round"
        className={styles.vecDraw} style={{ animationDelay: '0.12s' }} />
      <polygon points={arrowPts(ox, oy, bx, by)} fill={colB}
        className={styles.arrowFade} style={{ animationDelay: '0.12s' }} />

      {/* Origin */}
      <circle cx={ox} cy={oy} r={3.5} fill="rgba(255,255,255,0.18)" />
      <circle cx={ox} cy={oy} r={1.5} fill="rgba(255,255,255,0.55)" />

      {/* Angle label */}
      {angle > 0.06 && (
        <text x={lblX.toFixed(2)} y={lblY.toFixed(2)}
          fill={col} fontSize="10" fontFamily="'Courier New', monospace"
          textAnchor="middle" dominantBaseline="middle" fontWeight="700">
          {angleDeg.toFixed(1)}°
        </text>
      )}

      {/* Vector labels */}
      <text x={ax + 9} y={ay + 1}
        fill={colA} fontSize="11" fontFamily="var(--font)" fontWeight="700"
        dominantBaseline="middle">A</text>
      <text
        x={(bx + (angle > 1.4 ? -12 : 8)).toFixed(2)}
        y={(by - 6).toFixed(2)}
        fill={colB} fontSize="11" fontFamily="var(--font)" fontWeight="700"
        textAnchor={angle > 1.4 ? 'end' : 'start'}>B</text>
    </svg>
  );
}
