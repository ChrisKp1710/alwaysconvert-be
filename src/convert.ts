import { createWriteStream, unlink, createReadStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import archiver from "archiver";
import ffmpeg from "fluent-ffmpeg";

// Tipo per il risultato da restituire al frontend
type ConvertedResult = {
  stream: NodeJS.ReadableStream;
  mime: string;
  filename: string;
};

// Funzione principale per convertire i file
export async function convertFiles(
  files: Express.Multer.File[],
  format: string
): Promise<ConvertedResult> {
  const convertedFiles: string[] = [];

  // Itera sui file caricati
  for (const file of files) {
    // Crea percorsi temporanei per input e output
    const tmpInput = join(tmpdir(), `${randomUUID()}-${file.originalname}`);
    const tmpOutput = tmpInput.replace(/\.[^/.]+$/, `.${format}`);

    // Salva il file caricato su disco
    await saveToDisk(tmpInput, file.buffer);
    // Converte il file usando ffmpeg
    await convertWithFFmpeg(tmpInput, tmpOutput, format);

    // Aggiungi il file convertito all'array
    convertedFiles.push(tmpOutput);

    // Elimina il file di input temporaneo
    unlink(tmpInput, () => {});
  }

  // Se è stato convertito un solo file, restituiscilo direttamente
  if (convertedFiles.length === 1) {
    const filename = `converted-${Date.now()}.${getExtension(convertedFiles[0])}`;
    const stream = createReadStream(convertedFiles[0]);
    const mime = getMimeType(filename);

    // Elimina il file convertito dopo l'invio
    stream.on("end", () => {
      unlink(convertedFiles[0], () => {});
    });

    return { stream, mime, filename };
  }

  // Altrimenti, crea un archivio ZIP con tutti i file convertiti
  const zipName = `converted-${Date.now()}.zip`;
  const zipPath = join(tmpdir(), zipName);
  await createZip(convertedFiles, zipPath);

  const stream = createReadStream(zipPath);
  const mime = "application/zip";

  // Elimina l'archivio ZIP e i file convertiti dopo l'invio
  stream.on("end", () => {
    unlink(zipPath, () => {});
    convertedFiles.forEach((f) => unlink(f, () => {}));
  });

  return { stream, mime, filename: zipName };
}

// Funzione per salvare il buffer del file su disco
function saveToDisk(path: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = createWriteStream(path);
    writer.write(buffer);
    writer.end();
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Funzione per convertire il file usando ffmpeg
function convertWithFFmpeg(
  inputPath: string,
  outputPath: string,
  format: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

// Funzione per creare un archivio ZIP dei file convertiti
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

// Funzione per estrarre l'estensione del file
function getExtension(path: string): string {
  return path.split(".").pop() || "bin";
}

// Funzione per ottenere il tipo MIME del file
function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  const types: Record<string, string> = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    webm: "video/webm",
    zip: "application/zip",
  };
  return types[ext] || "application/octet-stream";
}
