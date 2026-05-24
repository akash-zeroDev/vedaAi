import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import redisClient from './config/redis';
import assignmentRoutes from './routes/assignmentRoutes';
import './workers/assessmentWorker';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/assignments', assignmentRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  await connectDB();
  
  if (redisClient.status === 'ready') {
    console.log('Redis client is ready');
  }

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
