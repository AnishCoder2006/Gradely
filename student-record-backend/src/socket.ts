import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

interface AuthedSocket extends Socket {
  user?: { id: string; role: string };
}

const onlineUsers = new Map<string, Set<string>>();

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_EVENTS = 5;
const socketEventLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = socketEventLog.get(userId) ?? [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_EVENTS) {
    socketEventLog.set(userId, recent);
    return true;
  }
  recent.push(now);
  socketEventLog.set(userId, recent);
  return false;
}

let io: SocketIOServer;

export function initSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: { origin: 'http://localhost:5173', credentials: true },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const userId = socket.user!.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    socket.join('announcements');

    // Tell everyone this user just came online
    io.emit('presence:update', { userId, online: true });

    // Let a newly-connected client fetch the full current online list
    socket.on('presence:request', () => {
      socket.emit('presence:list', Array.from(onlineUsers.keys()));
    });

    socket.on('doubt:join', (doubtId: string) => {
      if (typeof doubtId !== 'string' || doubtId.length > 64) return;
      socket.join(`doubt:${doubtId}`);
    });

    socket.on('doubt:leave', (doubtId: string) => {
      if (typeof doubtId !== 'string') return;
      socket.leave(`doubt:${doubtId}`);
    });

    socket.on('doubt:typing', (payload: { doubtId: string; isTyping: boolean }) => {
      if (!payload?.doubtId) return;
      socket.to(`doubt:${payload.doubtId}`).emit('doubt:typing', {
        userId, isTyping: !!payload.isTyping,
      });
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('presence:update', { userId, online: false });
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized — call initSocket(server) first');
  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export { isRateLimited };