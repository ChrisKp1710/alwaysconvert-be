# 🎯 AlwaysConvert Backend

Questo è il **backend Express** del progetto [AlwaysConvert](https://alwaysconvert.netlify.app), un convertitore file illimitato progettato per essere **leggero, sicuro e completamente privato**.

---

## 🚀 Cosa fa questo backend?

- Riceve uno o più file da convertire (immagini, video, audio).
- Converte i file nel formato desiderato (`.jpg`, `.mp4`, `.mp3`, ecc.).
- Ritorna il file convertito al client **senza mai salvarlo su disco**.
- Gestisce tutto in **memoria RAM**, garantendo velocità e privacy.

---

## 🔐 Sicurezza & Privacy

**AlwaysConvert Backend è stato costruito con la privacy come priorità assoluta:**

- ❌ **Nessun salvataggio su disco:** tutti i file vengono gestiti in memoria e poi eliminati.
- ❌ **Nessuna registrazione o tracking**: non tracciamo IP, nomi file o metadati.
- 🔒 **Senza database, senza log di contenuto**: solo conversione temporanea e istantanea.
- ✅ **Cancellazione automatica**: i file non vengono mai archiviati permanentemente.
- 💡 Ideale per chi desidera convertire file sensibili (documenti, immagini personali, ecc.).

---

## ⚙️ Come funziona

1. Il frontend invia un `POST` a `/convert` con i file e il formato desiderato.
2. Il backend utilizza `multer` per gestire i file in **memoria** (RAM).
3. I file vengono processati tramite la funzione `convertFiles(...)`.
4. Il backend restituisce il file convertito al client come **stream**.
5. Fine. Il file viene automaticamente eliminato dalla memoria.

---

## 🛠 Tecnologie utilizzate

- **Node.js** + **Express**
- **Multer** per l’upload in memoria
- **CORS** configurato per il frontend
- **FFmpeg (lato client)** per la conversione multimediale

---

## 🧪 Endpoint disponibili

| Metodo | Route         | Descrizione                      |
|--------|---------------|----------------------------------|
| GET    | `/test-cors`  | Verifica se CORS funziona        |
| POST   | `/convert`    | Upload e conversione file        |

---

## 🚀 Avvio in locale

1. Clona il progetto backend:
   ```bash
   git clone https://github.com/tuo-utente/alwaysconvert-be.git
   cd alwaysconvert-be
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Avvia il server (porta di default: `5050`)
   ```bash
   npm run dev
   ```

4. Il backend sarà disponibile su:
   ```
   http://localhost:5050
   ```

---

## ✅ Esempio di chiamata dal frontend

```ts
const formData = new FormData();
formData.append("files", file); // uno o più file
formData.append("to", "mp3"); // formato desiderato

const response = await fetch("http://localhost:5050/convert", {
  method: "POST",
  body: formData,
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
```

---

## 🙏 Crediti

Sviluppato con ❤️ da [Christian Koscielniak Pinto](https://kodechris.dev)
Sempre gratuito, open-source e privacy-first.

---

## 📄 Licenza

Distribuito sotto licenza **MIT**.
