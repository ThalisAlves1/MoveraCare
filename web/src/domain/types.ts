export type PerfilUsuario = 'ENFERMAGEM' | 'MAQUEIRO' | 'COORDENADOR' | 'ADMINISTRADOR'
export type PrioridadeOperacional = 'NORMAL' | 'URGENTE' | 'CRITICO'
export type RiscoTransporte = 'BAIXO' | 'MEDIO' | 'ALTO'
export type StatusChamado = 'AGUARDANDO_MAQUEIRO' | 'ENVIADO' | 'ACEITO' | 'A_CAMINHO_DA_ORIGEM' | 'EM_TRANSITO' | 'CONCLUIDO_ENTREGUE' | 'CANCELADO' | 'ATRASADO'

export type Setor = {
  id: string
  nome: string
  ordemRota: number
  qrCodeId: string
  ativo: boolean
}

export type Usuario = {
  id: string
  nome: string
  login: string
  perfil: PerfilUsuario
  setorVinculado?: string
  ativo: boolean
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
  solicitanteId: string
  solicitanteNome: string
  maqueiroResponsavelId?: string
  maqueiroResponsavelNome?: string
  criadoEm: string
  atualizadoEm: string
  observacoes: string
  checklist: ChecklistTransporte
  horarioAceite?: string
  horarioQrOrigem?: string
  horarioQrDestino?: string
  horarioConclusao?: string
  motivoCancelamento?: string
  motivoRecusa?: string
  tentativasQrInvalidas: Array<{
    valorLido: string
    etapa: string
    criadoEm: string
  }>
}
