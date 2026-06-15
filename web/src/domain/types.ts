export type PerfilUsuario = 'ENFERMAGEM' | 'COORDENADOR' | 'ADMINISTRADOR'

export type PrioridadeOperacional = 'NORMAL' | 'URGENTE' | 'CRITICO'

export type RiscoTransporte = 'BAIXO' | 'MEDIO' | 'ALTO'

export type StatusChamado =
  | 'AGUARDANDO_MAQUEIRO'
  | 'A_CAMINHO_DA_ORIGEM'
  | 'EM_TRANSITO'
  | 'CONCLUIDO_ENTREGUE'
  | 'CANCELADO'
  | 'ATRASADO'

export type Setor = {
  id: string
  nome: string
  ordemRota: number
  qrCodeId: string
}

export type ChecklistTransporte = {
  pacienteIdentificado: boolean
  origemDestinoConfirmados: boolean
  destinoComunicado: boolean
  equipeMinimaConfirmada: boolean
  oxigenioEquipamento: 'SIM' | 'NAO' | 'NAO_SE_APLICA'
  precaucaoInfeccao: 'PADRAO' | 'CONTATO' | 'GOTICULA' | 'AEROSSOL' | 'REVERSO'
}

export type ChamadoTransporte = {
  id: string
  numero: string
  pacienteCodigoOuIniciais: string
  origem: Setor
  destino: Setor
  tipoTransporte: string
  prioridade: PrioridadeOperacional
  risco: RiscoTransporte
  status: StatusChamado
  solicitante: string
  maqueiroResponsavel?: string
  criadoEm: string
  observacoes: string
  checklist: ChecklistTransporte
}
