export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  avatar_url: string;
  cover_url: string;
  is_blocked: boolean;
  must_change_password: boolean;
  created_at: string;
}

export type PurchaseRequestStatus = 
  | 'Aguardando' 
  | 'Compra realizada' 
  | 'Entregue' 
  | 'Cancelada';

export type RequestPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface RequestItem {
  id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  destino?: string;
  cod_fabricante?: string;
  marca?: string;
  valor_unitario_estimado: number;
  observacao?: string;
}

export interface CatalogItem {
  id: string;
  codigo: string;
  descricao: string;
  valor_unitario_estimado: number;
  unidade: string;
  categoria?: string;
  observacao?: string;
  criado_em?: string;
  atualizado_em?: string;
  criado_por?: string;
}

export interface Attachment {
  id: string;
  nome: string;
  tipo: string;
  tamanho?: number;
  data_url: string;
  data_upload: string;
}

export interface AuditLog {
  id: string;
  data_hora: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_username: string;
  acao: string;
  detalhes: string;
  status_anterior?: PurchaseRequestStatus;
  status_novo?: PurchaseRequestStatus;
}

export interface PurchaseRequest {
  id: string;
  numero_solicitacao: string;
  requerente?: string;
  solicitante_id?: string;
  solicitante_nome: string;
  solicitante_username?: string;
  local_entrega?: string;
  data_limite?: string;
  para_onde_pedido?: string;
  centro_custo: string;
  status: PurchaseRequestStatus;
  prioridade: RequestPriority;
  justificativa?: string;
  itens: RequestItem[];
  valor_total: number;
  anexos: Attachment[];
  observacoes?: string;
  data_criacao: string;
  data_atualizacao: string;
  historico_auditoria: AuditLog[];
}

export interface SystemSettings {
  activeTheme: 'ocean' | 'forest' | 'default';
  updated_at?: string;
  updated_by?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
