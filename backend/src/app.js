import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';

import ticketRoutes from './routes/ticketRoutes.js';
import configRoutes from './routes/configRoutes.js';
import errorHandler from './middleware/errorHandler.js';

import { testConnection }   from './config/db.js';
import { runMigrations }    from './db/migrations.js';
import { initModel }        from './services/embeddingService.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.use('/api/tickets', ticketRoutes);
app.use('/api/config',  configRoutes);
app.use(errorHandler);

async function bootstrap() {
  await testConnection();
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`[Server] http://localhost:${PORT}`);
    initModel().catch((e) => console.error('[AI] Model init error:', e.message));
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  process.exit(1);
});
