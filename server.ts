import app from './src/apiApp';
import path from 'path';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';

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
