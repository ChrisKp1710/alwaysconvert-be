import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { convertFiles } from "./convert";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
//app.use(helmet());

const upload = multer({ storage: multer.memoryStorage() });

// ✅ Aggiunta la rotta GET in cima
app.get("/", (req, res) => {
  res.send("✅ AlwaysConvert Backend attivo!");
});

app.post("/convert", upload.array("files"), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const result = await convertFiles(files);

    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.setHeader("Content-Type", result.mime);
    result.stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la conversione.");
  }
});

// ✅ L'ultima riga: avvia il server
app.listen(PORT, () => {
  console.log(`✅ Backend avviato su http://localhost:${PORT}`);
});
