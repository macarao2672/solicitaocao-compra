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
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
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
          solicitante: { type: Type.STRING, description: "Nome do Solicitante (geralmente nas observações)" },
          para_onde_pedido: { type: Type.STRING, description: "Aplicação / Uso / Local onde o pedido será usado (geralmente nas observações, ex: PARA USO NO CAMINHAO...)" },
          local_entrega: { type: Type.STRING, description: "Local de Entrega" },
          data_emissao: { type: Type.STRING, description: "Data de emissão da solicitação no formato DD/MM/AAAA" },
          data_limite: { type: Type.STRING, description: "Data limite no formato DD/MM/AAAA" },
          prioridade: { type: Type.STRING, description: "Prioridade (Alta, Média, Baixa)" },
          centro_custo: { type: Type.STRING, description: "Centro de Resultado ou Centro de Custo" },
          observacoes: { type: Type.STRING, description: "Observação geral completa" },
          itens: {
            type: Type.ARRAY,
            description: "Lista de itens contidos na solicitação (tabela)",
            items: {
              type: Type.OBJECT,
              properties: {
                codigo: { type: Type.STRING, description: "Código numérico do item (ex: 58856)" },
                descricao: { type: Type.STRING, description: "Descrição do produto" },
                quantidade: { type: Type.NUMBER, description: "Quantidade solicitada (ex: 1, 2.5)" },
                unidade: { type: Type.STRING, description: "Unidade de medida (UN, PC, CX, KG, L, etc)" },
                destino: { type: Type.STRING, description: "Destino do item (ex: ALMOXARIFADO)" },
                cod_fabricante: { type: Type.STRING, description: "Código do Fabricante" },
                marca: { type: Type.STRING, description: "Marca do item" }
              }
            }
          }
        }
      };

      // Strip "data:image/jpeg;base64," if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extraia os dados desta solicitação de compra e preencha o JSON de acordo com o schema. Seja flexível se os rótulos forem levemente diferentes. Encontre o número da solicitação, pode estar flutuando abaixo do texto 'Solicitação'."
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

      const extractedText = response.text;
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

