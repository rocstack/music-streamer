import { PrismaClient } from '@prisma/client';
import express, { NextFunction, Response, Request } from 'express';
import path from 'path';
import fs from 'fs';
import { SongService } from './services/song';
import { ScannerService } from './services/scanner';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Use the middleware to inject Prisma into each request
app.use((req: Request, res: Response, next: NextFunction): void => {
  req.prisma = prisma;
  next();
});

app.get('/songs', async (req: Request, res) => {
  try {
    const songService = new SongService(req.prisma);
    const songs = await songService.getAllSongs();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

app.get('/scan', async (req: Request, res) => {
  const scannerService = new ScannerService(req.prisma);
  scannerService.scan();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
