import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import crypto from 'crypto';
import NodeID3 from 'node-id3';
import path from 'path';

export class FileService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Compute checksum (e.g., using SHA-256)
  private computeChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256'); // Use SHA-256 for the checksum
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Extract metadata from the MP3 file using node-id3
  private extractMetadata(filePath: string): any {
    const tags = NodeID3.read(filePath);
    const metadata = {
      title: tags?.title || path.basename(filePath, '.mp3'), // Use filename if title is not present
      artist: tags?.artist || 'Unknown Artist',
      album: tags?.album || 'Unknown Album',
      genre: tags?.genre || 'Unknown Genre',
      year: tags?.year ? parseInt(tags.year) : null,
    };
    return metadata;
  }

  // Add a file to the database, extracting metadata from the file itself
  async addFile(filePath: string): Promise<void> {
    try {
      const stat = fs.statSync(filePath);
      const filename = filePath.split('/').pop() || 'unknown';
      const directory = filePath.replace(`/${filename}`, '');
      const extension = filename.split('.').pop() || '';
      const lastUpdated = stat.mtime;
      const firstAdded = stat.ctime;

      // Compute the checksum for the file
      const checksum = this.computeChecksum(filePath);

      // Check if the file with the same checksum already exists
      const existingFile = await this.prisma.file.findUnique({
        where: { checksum },
      });

      if (existingFile) {
        console.log(`File already exists in the database: ${filePath}`);
        // Optionally, you can update metadata here if the file exists
        return;
      }

      // Extract metadata from the file
      const metadata = this.extractMetadata(filePath);

      console.log({
        data: {
          path: filePath,
          filename,
          directory,
          extension,
          lastUpdated,
          firstAdded,
          checksum,
          metadata: JSON.stringify(metadata), // Store metadata as a string
        },
      });

      // Add the new file entry to the database
      // const newFile = await this.prisma.file.create({
      //   data: {
      //     path: filePath,
      //     filename,
      //     directory,
      //     extension,
      //     lastUpdated,
      //     firstAdded,
      //     checksum,
      //     metadata: JSON.stringify(metadata), // Store metadata as a string
      //   },
      // });

      // Then create the song record associated with this file
      // await this.prisma.song.create({
      //   data: {
      //     title: metadata.title,
      //     artist: metadata.artist,
      //     album: metadata.album,
      //     externalMetadata: {
      //       genre: metadata.genre,
      //       year: metadata.year,
      //     },
      //     file: {
      //       connect: { id: newFile.id }, // Link the song to the file
      //     },
      //   },
      // });

      console.log(`File added to the database: ${filePath}`);
    } catch (error) {
      console.error(`Failed to add file: ${filePath}`, error);
    }
  }
}
