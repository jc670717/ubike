import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import healthHandler from './api/health.ts';
import districtsHandler from './api/youbike/districts.ts';
import stationsHandler from './api/youbike/stations.ts';
import parseSearchHandler from './api/gemini/parse-search.ts';

const app = express();
app.use(express.json());

// API endpoints
app.get('/api/health', (req: Request, res: Response) => healthHandler(req, res));
app.get('/api/youbike/districts', (req: Request, res: Response) => districtsHandler(req, res));
app.get('/api/youbike/stations', (req: Request, res: Response) => stationsHandler(req, res));
app.post('/api/gemini/parse-search', (req: Request, res: Response) => parseSearchHandler(req, res));

async function startServer() {
  const PORT = 3000;

  // Vite development middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`臺北市 YouBike 即時查詢伺服器運行於 http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('伺服器啟動失敗:', err);
  process.exit(1);
});
