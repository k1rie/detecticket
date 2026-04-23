/**
 * Cosine angle formula: θ = arccos(<u,v> / (||u|| * ||v||))
 * θ = 0   → identical vectors
 * θ = π/2 → orthogonal (unrelated)
 */
export function cosineAngle(u, v) {
  let dot = 0;
  let normU = 0;
  let normV = 0;

  for (let i = 0; i < u.length; i++) {
    dot += u[i] * v[i];
    normU += u[i] * u[i];
    normV += v[i] * v[i];
  }

  normU = Math.sqrt(normU);
  normV = Math.sqrt(normV);

  if (normU === 0 || normV === 0) return Math.PI / 2;

  const cosTheta = Math.max(-1, Math.min(1, dot / (normU * normV)));
  return Math.acos(cosTheta);
}

export function angleSimilarityPercent(u, v) {
  const angle = cosineAngle(u, v);
  return (1 - angle / (Math.PI / 2)) * 100;
}

export function getStatus(angleRad) {
  if (angleRad < 0.18) return 'duplicate';
  if (angleRad < 0.55) return 'related';
  return 'different';
}
