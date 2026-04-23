import { getEmbedding } from './embeddingService.js';
import { cosineAngle, angleSimilarityPercent } from '../utils/cosineAngle.js';
import { Config } from '../models/Config.js';

function buildText(ticket) {
  return `${ticket.title || ''} ${ticket.description || ''}`.trim();
}

export async function getThresholds() {
  return Config.getThresholds();
}

function classify(angleRad, thresholds) {
  if (angleRad < thresholds.duplicate) return 'duplicate';
  if (angleRad < thresholds.related)   return 'related';
  return 'different';
}

export async function compareTwo(ticketA, ticketB) {
  const [embA, embB, thresholds] = await Promise.all([
    getEmbedding(buildText(ticketA)),
    getEmbedding(buildText(ticketB)),
    getThresholds(),
  ]);

  const angle      = cosineAngle(embA, embB);
  const similarity = angleSimilarityPercent(embA, embB);
  const status     = classify(angle, thresholds);

  return {
    angle,
    angleDeg: parseFloat(((angle * 180) / Math.PI).toFixed(4)),
    similarity: parseFloat(similarity.toFixed(3)),
    status,
    isDuplicate: status === 'duplicate',
    thresholds,
  };
}

export async function findDuplicatesInBatch(tickets) {
  const texts      = tickets.map(buildText);
  const thresholds = await getThresholds();

  const embeddings = await Promise.all(texts.map(getEmbedding));

  const results = [];

  for (let i = 0; i < tickets.length; i++) {
    for (let j = i + 1; j < tickets.length; j++) {
      const angle      = cosineAngle(embeddings[i], embeddings[j]);
      const similarity = angleSimilarityPercent(embeddings[i], embeddings[j]);
      const status     = classify(angle, thresholds);

      results.push({
        ticketA:  tickets[i],
        ticketB:  tickets[j],
        indexA:   i,
        indexB:   j,
        angle,
        angleDeg:    parseFloat(((angle * 180) / Math.PI).toFixed(4)),
        similarity:  parseFloat(similarity.toFixed(3)),
        status,
        thresholds,
      });
    }
  }

  return results.sort((a, b) => a.angle - b.angle);
}
