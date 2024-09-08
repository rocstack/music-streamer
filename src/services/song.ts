import { PrismaClient, Song } from '@prisma/client';

export class SongService {
  constructor(private prisma: PrismaClient) {}

  getAllSongs(): Promise<Song[]> {
    return this.prisma.song.findMany();
  }
}
