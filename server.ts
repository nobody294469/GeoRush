import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RoomManager } from './server/roomManager';
import { setupSocketHandlers } from './server/socketHandlers';
import { ClientToServerEvents, ServerToClientEvents } from './src/shared/types/multiplayer';

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  // Initialize Socket.IO
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const roomManager = new RoomManager();
  setupSocketHandlers(io, roomManager);

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: roomManager.getRoomCount(),
      timestamp: new Date().toISOString()
    });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    try {
      io.close();
      server.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 1000).unref();
    } catch {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
