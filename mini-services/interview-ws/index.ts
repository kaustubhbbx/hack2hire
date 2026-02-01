/**
 * Interview WebSocket Service
 * Real-time interview updates and notifications
 * Runs on port 3003
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = 3003;
const httpServer = createServer();

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Store active sessions and their socket IDs
const activeSessions = new Map<string, Set<string>>();
const socketToSession = new Map<string, string>();

/**
 * Socket.IO connection handler
 */
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join an interview session
  socket.on('join-session', (sessionId: string) => {
    console.log(`Socket ${socket.id} joining session: ${sessionId}`);

    // Leave previous session if any
    const previousSession = socketToSession.get(socket.id);
    if (previousSession) {
      socket.leave(previousSession);
      const sessionSockets = activeSessions.get(previousSession);
      if (sessionSockets) {
        sessionSockets.delete(socket.id);
        if (sessionSockets.size === 0) {
          activeSessions.delete(previousSession);
        }
      }
    }

    // Join new session
    socket.join(sessionId);
    socketToSession.set(socket.id, sessionId);

    // Add to active sessions
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new Set());
    }
    activeSessions.get(sessionId)!.add(socket.id);

    // Confirm join
    socket.emit('session-joined', {
      sessionId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Notify others in session
    socket.to(sessionId).emit('user-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Leave an interview session
  socket.on('leave-session', (sessionId: string) => {
    console.log(`Socket ${socket.id} leaving session: ${sessionId}`);

    socket.leave(sessionId);
    socketToSession.delete(socket.id);

    const sessionSockets = activeSessions.get(sessionId);
    if (sessionSockets) {
      sessionSockets.delete(socket.id);
      if (sessionSockets.size === 0) {
        activeSessions.delete(sessionId);
      }
    }

    // Notify others in session
    socket.to(sessionId).emit('user-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast new question
  socket.on('broadcast-question', (data: { sessionId: string; question: any }) => {
    console.log(`Broadcasting question for session ${data.sessionId}`);
    io.to(data.sessionId).emit('new-question', {
      question: data.question,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast answer evaluation
  socket.on('broadcast-evaluation', (data: { sessionId: string; evaluation: any }) => {
    console.log(`Broadcasting evaluation for session ${data.sessionId}`);
    io.to(data.sessionId).emit('answer-evaluated', {
      evaluation: data.evaluation,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast performance update
  socket.on('broadcast-performance', (data: { sessionId: string; metrics: any }) => {
    console.log(`Broadcasting performance update for session ${data.sessionId}`);
    io.to(data.sessionId).emit('performance-updated', {
      metrics: data.metrics,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast interview status change
  socket.on('broadcast-status', (data: { sessionId: string; status: string; reason?: string }) => {
    console.log(`Broadcasting status change for session ${data.sessionId}: ${data.status}`);
    io.to(data.sessionId).emit('interview-status-changed', {
      status: data.status,
      reason: data.reason,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast time warning
  socket.on('broadcast-time-warning', (data: { sessionId: string; questionId: string; timeRemaining: number }) => {
    console.log(`Broadcasting time warning for session ${data.sessionId}`);
    io.to(data.sessionId).emit('time-warning', {
      questionId: data.questionId,
      timeRemaining: data.timeRemaining,
      timestamp: new Date().toISOString()
    });
  });

  // Request session info
  socket.on('get-session-info', (sessionId: string) => {
    const sessionSockets = activeSessions.get(sessionId);
    socket.emit('session-info', {
      sessionId,
      activeUsers: sessionSockets ? sessionSockets.size : 0,
      timestamp: new Date().toISOString()
    });
  });

  // Heartbeat for connection monitoring
  socket.on('heartbeat', (data: { sessionId?: string }) => {
    socket.emit('heartbeat-ack', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const sessionId = socketToSession.get(socket.id);
    if (sessionId) {
      const sessionSockets = activeSessions.get(sessionId);
      if (sessionSockets) {
        sessionSockets.delete(socket.id);
        if (sessionSockets.size === 0) {
          activeSessions.delete(sessionId);
        }
      }

      // Notify others in session
      socket.to(sessionId).emit('user-disconnected', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    }

    socketToSession.delete(socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Interview WebSocket Service running on port ${PORT}`);
  console.log(`WebSocket endpoint: / (via gateway with ?XTransformPort=${PORT})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
