import { PurchaseRequest, PurchaseRequestStatus, RequestPriority, RequestItem, Attachment } from '../types';

export interface ParsedJsonRequest {
  numero_solicitacao?: string;
  ordem_compra?: string;
  status?: PurchaseRequestStatus;
  prioridade?: RequestPriority;
  centro_custo?: string;
  justificativa?: string;
  observacoes?: string;
  itens: Array<{
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario_estimado?: number;
    observacao?: string;
  }>;
  data_hora?: string;
  data_criacao?: string;
}

export interface JsonParseResult {
  valid: boolean;
  requests: ParsedJsonRequest[];
  error?: string;
}

/**
 * Normaliza e valida um JSON ou texto JSON que contenha uma solicitação ou lista de solicitações.
 * Suporta o formato do exemplo do usuário:
 * {
 *   "numero_solicitacao": "SOL-2026-950",
 *   "ordem_compra": "OC-99821",
 *   "status": "Aguardando",
 *   "observacao": "Separar com urgência para o trator principal que está parado na lavoura.",
 *   "itens": [
 *     {
 *       "codigo": "FILTRO-OLEO-HIDRAULICO",
 *       "descricao": "filtros de óleo hidráulico",
 *       "quantidade": 2,
 *       "unidade": "un"
 *     }
 *   ]
 * }
 */
export function parseRequestsJson(rawInput: string | any): JsonParseResult {
  let parsed: any;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { valid: false, requests: [], error: 'O conteúdo JSON está vazio.' };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (e: any) {
      return {
        valid: false,
        requests: [],
        error: `Formato JSON inválido: ${e.message || 'Verifique a sintaxe das chaves, aspas e vírgulas.'}`,
      };
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, requests: [], error: 'O arquivo JSON deve conter um objeto ou uma lista de solicitações.' };
  }

  // Se for um array de solicitações ou um único objeto
  const rawList: any[] = Array.isArray(parsed) ? parsed : [parsed];

  if (rawList.length === 0) {
    return { valid: false, requests: [], error: 'Nenhuma solicitação encontrada no arquivo JSON.' };
  }

  const normalizedRequests: ParsedJsonRequest[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') {
      return { valid: false, requests: [], error: `Elemento #${i + 1} não é um objeto de solicitação válido.` };
    }

    // Itens da solicitação
    const rawItens = item.itens || item.items || item.produtos || [];
    if (!Array.isArray(rawItens) || rawItens.length === 0) {
      return {
        valid: false,
        requests: [],
        error: `A solicitação ${item.numero_solicitacao || `#${i + 1}`} não possui a lista de itens ("itens": [...]).`,
      };
    }

    const normalizedItens: ParsedJsonRequest['itens'] = [];
    for (let j = 0; j < rawItens.length; j++) {
      const it = rawItens[j];
      const desc = it.descricao || it.desc || it.nome || it.produto || it.item || '';
      if (!desc || typeof desc !== 'string') {
        return {
          valid: false,
          requests: [],
          error: `Item #${j + 1} da solicitação não possui descrição ("descricao").`,
        };
      }

      const qtd = Number(it.quantidade || it.qtd || it.quant || 1);
      const unidade = (it.unidade || it.un || 'UN').toString().toUpperCase();
      const codigo = (it.codigo || it.cod || `ITEM-${String(j + 1).padStart(3, '0')}`).toString();
      const valorUnit = Number(it.valor_unitario_estimado || it.valor_unitario || it.valor || it.preco || 0);

      normalizedItens.push({
        codigo: codigo,
        descricao: desc,
        quantidade: isNaN(qtd) || qtd <= 0 ? 1 : qtd,
        unidade: unidade,
        valor_unitario_estimado: isNaN(valorUnit) || valorUnit < 0 ? 0 : valorUnit,
        observacao: it.observacao || it.obs || '',
      });
    }

    // Status
    let status: PurchaseRequestStatus = 'Aguardando';
    if (item.status) {
      const st = String(item.status).trim();
      if (['Aguardando', 'Compra realizada', 'Entregue', 'Cancelada'].includes(st)) {
        status = st as PurchaseRequestStatus;
      } else if (st.toLowerCase().includes('compra') || st.toLowerCase().includes('realizada')) {
        status = 'Compra realizada';
      } else if (st.toLowerCase().includes('entreg')) {
        status = 'Entregue';
      } else if (st.toLowerCase().includes('cancel')) {
        status = 'Cancelada';
      }
    }

    // Prioridade
    let prioridade: RequestPriority = 'Média';
    if (item.prioridade) {
      const pr = String(item.prioridade).trim().toLowerCase();
      if (pr.includes('urg')) prioridade = 'Urgente';
      else if (pr.includes('alt')) prioridade = 'Alta';
      else if (pr.includes('baix')) prioridade = 'Baixa';
      else prioridade = 'Média';
    } else if (item.observacao && String(item.observacao).toLowerCase().includes('urgência')) {
      prioridade = 'Urgente';
    }

    // Ordem de Compra
    let ordem_compra = '';
    if (item.ordem_compra) {
      ordem_compra = String(item.ordem_compra).trim();
    }

    // Observações e Justificativa
    const observacao = item.observacao || item.observacoes || item.obs || '';
    const justificativa = item.justificativa || (observacao ? `Obs: ${observacao}` : 'Importado automaticamente via arquivo JSON');
    const centro_custo = item.centro_custo || item.departamento || item.setor || 'Operações & Facilities';

    normalizedRequests.push({
      numero_solicitacao: item.numero_solicitacao ? String(item.numero_solicitacao).trim() : undefined,
      ordem_compra: ordem_compra || undefined,
      status: status,
      prioridade: prioridade,
      centro_custo: centro_custo,
      justificativa: justificativa,
      observacoes: observacao,
      itens: normalizedItens,
      data_hora: item.data_hora || item.data_criacao || item.data || undefined,
    });
  }

  return {
    valid: true,
    requests: normalizedRequests,
  };
}

export const JSON_EXAMPLE_TEMPLATE = `{
  "numero_solicitacao": "SOL-2026-950",
  "ordem_compra": "OC-99821",
  "status": "Aguardando",
  "observacao": "Separar com urgência para o trator principal que está parado na lavoura.",
  "itens": [
    {
      "codigo": "FILTRO-OLEO-HIDRAULICO",
      "descricao": "filtros de óleo hidráulico",
      "quantidade": 2,
      "unidade": "un"
    },
    {
      "codigo": "OLEO-MOTOR-15W40",
      "descricao": "óleo para motor 15W40",
      "quantidade": 20,
      "unidade": "lt"
    },
    {
      "codigo": "GRAXA-BALDE",
      "descricao": "graxa em balde",
      "quantidade": 10,
      "unidade": "kg"
    },
    {
      "codigo": "CORREIA-V-PERFIL-B",
      "descricao": "correias em V perfil B",
      "quantidade": 4,
      "unidade": "un"
    },
    {
      "codigo": "ABRACADEIRA-ACO-2-POLEGADAS",
      "descricao": "pacote de abraçadeiras de aço 2 polegadas",
      "quantidade": 1,
      "unidade": "pct"
    },
    {
      "codigo": "CAIXA-FUSIVEL-AUTOMOTIVO",
      "descricao": "caixas de fusíveis automotivos variados",
      "quantidade": 3,
      "unidade": "cx"
    }
  ],
  "data_hora": "2026-08-20T12:41:18"
}`;
