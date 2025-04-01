import express from "express";
import cors from "cors";
import multer from "multer";
import { convertFiles } from "./convert"; // Funzione di conversione

const app = express();
const port = 5050;


// Configurazione CORS molto permissiva
app.use(cors({
  origin: "*", // ⚠️ solo per testing!
}));


// Configura Multer per gestire l'upload dei file
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Endpoint di test per verificare che CORS funzioni
app.get("/test-cors", (req, res) => {
  res.json({ message: "CORS funziona correttamente!" });
});

app.use((req, res, next) => {
  console.log(`Richiesta ricevuta da: ${req.headers.origin}`);
  next();
});


// Route di conversione
app.post("/convert", upload.array("files"), async (req, res) => {
  try {
    console.log("Richiesta ricevuta a /convert");

    // Nessun file caricato?
    if (!req.files || req.files.length === 0) {
      console.log("Nessun file caricato");
      res.status(400).send("No files uploaded.");
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
      res.status(400).send("Format not specified.");
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
    res.status(500).send("Error converting files.");
  }

});


// Avvia il server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📝 CORS configurato per accettare richieste da http://localhost:3000`);
});
