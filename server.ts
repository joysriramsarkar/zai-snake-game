// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`[${signal}] Received, shutting down...`);

      const closeHttpServer = new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error('[HTTP] Server close error:', err);
            return reject(err);
          }
          console.log('[HTTP] Server closed.');
          resolve();
        });
      });

      const closeSocketIoServer = new Promise<void>((resolve) => {
        io.close(() => {
          console.log('[Socket.IO] Server closed.');
          resolve();
        });
      });

      Promise.all([closeHttpServer, closeSocketIoServer])
        .then(() => {
          console.log('All servers closed. Exiting.');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error during graceful shutdown:', err);
          process.exit(1);
        });
    };

    // Gracefully handle shutdown signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // For Ctrl+C
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // For nodemon restart

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
