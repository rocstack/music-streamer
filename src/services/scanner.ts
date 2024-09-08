import path from 'path';
import fs from 'fs';
import crypto from 'crypto'; // For computing checksum
import NodeID3 from 'node-id3';
import { PrismaClient } from '@prisma/client';
import { FileService } from './file';

export class ScannerService {
  private musicDirectory: string;
  private fileService: FileService;

  constructor(prisma: PrismaClient) {
    this.musicDirectory = path.join(__dirname, '../../public/music');
    this.fileService = new FileService(prisma);
  }

  // Recursively scan directories and process files
  async scan() {
    await this.scanDirectory(this.musicDirectory);
  }

  private async scanDirectory(directory: string) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);

      if (fs.statSync(filePath).isDirectory()) {
        await this.scanDirectory(filePath); // Recursively scan subdirectories
      } else if (path.extname(file) === '.mp3') {
        await this.fileService.addFile(filePath); // Use the FileService to add the file
      }
    }
  }
}
