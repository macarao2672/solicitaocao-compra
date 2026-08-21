import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser com limite maior para imagens base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Rota de Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OCR Endpoint using Gemini
  app.post(["/api/ocr", "/api/extract-receipt"], async (req, res) => {
    try {
      const { imageBase64, image, mimeType } = req.body;
      const finalImageBase64 = imageBase64 || image;
      
      if (!finalImageBase64) {
        res.status(400).json({ success: false, error: "Nenhuma imagem enviada." });
        return;
      }

      // Initialize Gemini Client
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ success: false, error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          numero_solicitacao: { type: Type.STRING, description: "Número da solicitação. Normalmente encontrado perto de 'Solicitação' ou isolado no topo." },
          requerente: { type: Type.STRING, description: "Nome do Requerente" },
          observacoes: { type: Type.STRING, description: "Observação geral completa" }
        }
      };

      // Strip "data:image/jpeg;base64," if present
      const base64Data = finalImageBase64.replace(/^data:image\/\w+;base64,/, "");

      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: "Extraia apenas as informações principais desta imagem: o número da solicitação, o requerente e as observações contidas. O restante será preenchido manualmente, então concentre-se apenas nestes 3 dados cruciais."
                  },
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType || "image/jpeg"
                    }
                  }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.1
            }
          });
          break; // Sucesso, sai do loop
        } catch (err: any) {
          if ((err.status === 503 || err.status === 429) && retries < maxRetries - 1) {
            retries++;
            console.log(`Modelo indisponível (${err.status}). Tentativa ${retries} de ${maxRetries}... aguardando.`);
            await new Promise(res => setTimeout(res, 1500 * Math.pow(2, retries)));
          } else {
            throw err;
          }
        }
      }

      const extractedText = response?.text;
      if (!extractedText) {
        throw new Error("Resposta vazia da inteligência artificial.");
      }

      const extractedData = JSON.parse(extractedText);
      res.json({ success: true, data: extractedData });
    } catch (error: any) {
      console.error("Erro na extração de OCR via Gemini:", error);
      res.status(500).json({ success: false, error: error.message || "Falha na extração" });
    }
  });

  // Middleware global de tratamento de erros para garantir resposta JSON em rotas /api

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('Erro não tratado na API:', err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Erro interno no servidor.',
      });
      return;
    }
    next(err);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();

