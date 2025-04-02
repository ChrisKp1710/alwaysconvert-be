import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { convertFiles } from "./convert"; // Funzione di conversione

const app = express();
const port = process.env.PORT || 5050;
const frontendUrl = process.env.FRONTEND_URL || "*";

// Configurazione CORS per accettare richieste dal frontend
app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  exposedHeaders: ["Content-Disposition"],
}));


// Configura Multer per gestire l'upload dei file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite di 50MB
});


// Endpoint di test per verificare che CORS funzioni
app.get("/test-cors", (req, res) => {
  res.json({
    message: "CORS funziona correttamente!",
    environment: process.env.NODE_ENV || "development",
    frontendUrl: frontendUrl
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "AlwaysConvert API è in esecuzione",
    version: "1.0.0"
  });
});

// Log delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} da ${req.headers.origin || 'origine sconosciuta'}`);
  next();
});


// Route di conversione
app.post("/convert", upload.array("files"), async (req, res) => {
  try {
    console.log("Richiesta ricevuta a /convert");

    // Nessun file caricato?
    if (!req.files || req.files.length === 0) {
      console.log("Nessun file caricato");
      res.status(400).json({ error: "No files uploaded." });
      return;
    }

    // Ottieni i file dalla richiesta
    const files = req.files as Express.Multer.File[];
    console.log(`Ricevuti ${files.length} file(s)`);

    const format = req.body.to;
    console.log(`Formato richiesto: ${format}`);

    // Formato mancante?
    if (!format) {
      console.log("Formato non specificato");
      res.status(400).json({ error: "Format not specified." });
      return;
    }

    // Converte i file
    console.log("Avvio conversione...");
    const result = await convertFiles(files, format);
    console.log("Conversione completata");

    // Imposta intestazioni per scaricamento
    res.setHeader("Content-Type", result.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    console.log("Invio file convertito");

    // Invia il file come stream
    result.stream.pipe(res);
  } catch (error) {
    console.error("Error converting files:", error);
    res.status(500).json({
      error: "Error converting files.",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});


// Gestione degli errori
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Si è verificato un errore interno del server." });
});

// Avvia il server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📝 CORS configurato per accettare richieste da ${frontendUrl}`);
});
