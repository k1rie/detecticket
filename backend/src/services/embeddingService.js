import { pipeline } from '@xenova/transformers';

let embedder = null;
let modelStatus = 'idle'; // idle | loading | ready | error

export function getModelStatus() {
  return modelStatus;
}

export async function initModel() {
  if (modelStatus === 'ready' || modelStatus === 'loading') return;

  modelStatus = 'loading';
  console.log('[Embedding] Loading paraphrase-multilingual-MiniLM-L12-v2...');

  try {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    );
    modelStatus = 'ready';
    console.log('[Embedding] Model ready.');
  } catch (err) {
    modelStatus = 'error';
    console.error('[Embedding] Failed to load model:', err.message);
    throw err;
  }
}

export async function getEmbedding(text) {
  if (modelStatus !== 'ready') {
    await initModel();
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
