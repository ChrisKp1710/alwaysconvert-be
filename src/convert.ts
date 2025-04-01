import { createWriteStream, unlink, createReadStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import archiver from "archiver";
import ffmpeg from "fluent-ffmpeg";
import type { Express } from "express";

type ConvertedResult = {
  stream: NodeJS.ReadableStream;
  mime: string;
  filename: string;
};

export async function convertFiles(files: Express.Multer.File[]): Promise<ConvertedResult> {
  const convertedFiles: string[] = [];

  for (const file of files) {
    const tmpInput = join(tmpdir(), `${randomUUID()}-${file.originalname}`);
    const ext = detectExtension(file.mimetype);
    const tmpOutput = tmpInput.replace(/\.[^/.]+$/, `.${ext}`);

    await saveToDisk(tmpInput, file.buffer);
    await convertWithFFmpeg(tmpInput, tmpOutput, ext);

    convertedFiles.push(tmpOutput);
    unlink(tmpInput, () => {});
  }

  if (convertedFiles.length === 1) {
    const filename = `converted-${Date.now()}.${getExtension(convertedFiles[0])}`;
    const stream = createReadStream(convertedFiles[0]);
    const mime = getMimeType(filename);

    stream.on("end", () => {
      unlink(convertedFiles[0], () => {});
    });

    return { stream, mime, filename };
  }

  const zipName = `converted-${Date.now()}.zip`;
  const zipPath = join(tmpdir(), zipName);

  await createZip(convertedFiles, zipPath);

  const stream = createReadStream(zipPath);
  const mime = "application/zip";

  stream.on("end", () => {
    unlink(zipPath, () => {});
    convertedFiles.forEach((f) => unlink(f, () => {}));
  });

  return { stream, mime, filename: zipName };
}

function saveToDisk(path: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = createWriteStream(path);
    writer.write(buffer);
    writer.end();
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function convertWithFFmpeg(inputPath: string, outputPath: string, format: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on("end", (_stdout: string | null, _stderr: string | null) => {
        resolve(); // Ignoriamo stdout/stderr ma la firma è corretta
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
}


function createZip(files: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip");

    archive.pipe(output);
    files.forEach((filePath) => {
      archive.file(filePath, { name: filePath.split("/").pop() || "file" });
    });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.finalize();
  });
}

function detectExtension(mime: string): string {
  if (mime.startsWith("image/")) return "webp";
  if (mime.startsWith("audio/")) return "mp3";
  if (mime.startsWith("video/")) return "mp4";
  return "bin";
}

function getExtension(path: string): string {
  return path.split(".").pop() || "bin";
}

function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  const types: Record<string, string> = {
    webp: "image/webp",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    zip: "application/zip",
  };
  return types[ext] || "application/octet-stream";
}
