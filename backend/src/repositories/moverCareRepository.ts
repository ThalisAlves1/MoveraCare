import { supabase } from '../config/supabaseClient.js'
import {
  ChamadoTransporte,
  ChecklistTransporte,
  PerfilUsuario,
  PrioridadeOperacional,
  RiscoTransporte,
  Setor,
  StatusChamado,
  Usuario
} from '../domain/types.js'

type UsuarioRow = {
  id: string
  nome: string
  login: string
  perfil: PerfilUsuario
  setor_vinculado: string | null
  ativo: boolean
}

type SetorRow = {
  id: string
  nome: string
  ordem_rota: number
  qr_code_id: string
  ativo: boolean
}

type ChamadoRow = {
  id: string
  numero: string
  paciente_codigo_ou_iniciais: string
  origem_id: string
  destino_id: string
  tipo_transporte: string
  prioridade: PrioridadeOperacional
  risco: RiscoTransporte
  status: StatusChamado
  solicitante_id: string
  solicitante_nome: string
  maqueiro_responsavel_id: string | null
  maqueiro_responsavel_nome: string | null
  observacoes: string | null
  checklist: ChecklistTransporte
  tentativas_qr_invalidas: Array<{ valorLido: string; etapa: string; criadoEm: string }>
  horario_aceite: string | null
  horario_qr_origem: string | null
  horario_qr_destino: string | null
  horario_conclusao: string | null
  motivo_cancelamento: string | null
  motivo_recusa: string | null
  criado_em: string
  atualizado_em: string
}

export function mapUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    login: row.login,
    perfil: row.perfil,
    setorVinculado: row.setor_vinculado ?? undefined,
    ativo: row.ativo
  }
}

export function mapSetor(row: SetorRow): Setor {
  return {
    id: row.id,
    nome: row.nome,
    ordemRota: row.ordem_rota,
    qrCodeId: row.qr_code_id,
    ativo: row.ativo
  }
}

export function mapChamado(row: ChamadoRow, setores: Setor[]): ChamadoTransporte {
  const origem = setores.find(s => s.id === row.origem_id)
  const destino = setores.find(s => s.id === row.destino_id)

  if (!origem || !destino) {
    throw new Error(`Setor não encontrado para o chamado ${row.id}.`)
  }

  return {
    id: row.id,
    numero: row.numero,
    pacienteCodigoOuIniciais: row.paciente_codigo_ou_iniciais,
    origem,
    destino,
    tipoTransporte: row.tipo_transporte,
    prioridade: row.prioridade,
    risco: row.risco,
    status: row.status,
    solicitanteId: row.solicitante_id,
    solicitanteNome: row.solicitante_nome,
    maqueiroResponsavelId: row.maqueiro_responsavel_id ?? undefined,
    maqueiroResponsavelNome: row.maqueiro_responsavel_nome ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    observacoes: row.observacoes ?? '',
    checklist: row.checklist,
    horarioAceite: row.horario_aceite ?? undefined,
    horarioQrOrigem: row.horario_qr_origem ?? undefined,
    horarioQrDestino: row.horario_qr_destino ?? undefined,
    horarioConclusao: row.horario_conclusao ?? undefined,
    motivoCancelamento: row.motivo_cancelamento ?? undefined,
    motivoRecusa: row.motivo_recusa ?? undefined,
    tentativasQrInvalidas: row.tentativas_qr_invalidas ?? []
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome', { ascending: true })

  if (error) throw error
  return ((data ?? []) as UsuarioRow[]).map(mapUsuario)
}

export async function buscarUsuarioPorLogin(login: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('login', login)
    .eq('ativo', true)
    .maybeSingle()

  if (error) throw error
  return data ? mapUsuario(data as UsuarioRow) : null
}

export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapUsuario(data as UsuarioRow) : null
}

export async function buscarPrimeiroUsuarioPorPerfil(perfil: PerfilUsuario): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('perfil', perfil)
    .eq('ativo', true)
    .limit(1)

  if (error) throw error
  const row = (data ?? [])[0] as UsuarioRow | undefined
  return row ? mapUsuario(row) : null
}

export async function listarSetores(): Promise<Setor[]> {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .eq('ativo', true)
    .order('ordem_rota', { ascending: true })

  if (error) throw error
  return ((data ?? []) as SetorRow[]).map(mapSetor)
}

async function listarChamadosRows(): Promise<ChamadoRow[]> {
  const { data, error } = await supabase
    .from('chamados')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) throw error
  return (data ?? []) as ChamadoRow[]
}

export async function listarChamados(): Promise<ChamadoTransporte[]> {
  const setores = await listarSetores()
  const rows = await listarChamadosRows()
  return rows.map(row => mapChamado(row, setores))
}

export async function buscarChamadoPorId(id: string): Promise<ChamadoTransporte | null> {
  const setores = await listarSetores()

  const { data, error } = await supabase
    .from('chamados')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapChamado(data as ChamadoRow, setores) : null
}

export async function gerarNumeroChamado(): Promise<string> {
  const { data, error } = await supabase
    .from('chamados')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)

  if (error) throw error

  const maiorAtual = Number((data?.[0] as { numero?: string } | undefined)?.numero ?? '139')
  const proximo = Number.isNaN(maiorAtual) ? 140 : maiorAtual + 1
  return String(proximo).padStart(6, '0')
}

export async function criarChamadoNoBanco(input: {
  pacienteCodigoOuIniciais: string
  origemId: string
  destinoId: string
  tipoTransporte: string
  prioridade: PrioridadeOperacional
  risco: RiscoTransporte
  solicitanteId: string
  solicitanteNome: string
  observacoes: string
  checklist: ChecklistTransporte
}): Promise<ChamadoTransporte> {
  const id = `c_${Date.now()}`
  const numero = await gerarNumeroChamado()
  const agora = new Date().toISOString()

  const { error } = await supabase.from('chamados').insert({
    id,
    numero,
    paciente_codigo_ou_iniciais: input.pacienteCodigoOuIniciais,
    origem_id: input.origemId,
    destino_id: input.destinoId,
    tipo_transporte: input.tipoTransporte,
    prioridade: input.prioridade,
    risco: input.risco,
    status: 'AGUARDANDO_MAQUEIRO',
    solicitante_id: input.solicitanteId,
    solicitante_nome: input.solicitanteNome,
    observacoes: input.observacoes,
    checklist: input.checklist,
    tentativas_qr_invalidas: [],
    criado_em: agora,
    atualizado_em: agora
  })

  if (error) throw error

  await registrarHistorico({
    chamadoId: id,
    statusAnterior: null,
    statusNovo: 'AGUARDANDO_MAQUEIRO',
    usuarioId: input.solicitanteId,
    usuarioNome: input.solicitanteNome,
    observacao: 'Chamado criado pela enfermagem.'
  })

  const chamado = await buscarChamadoPorId(id)
  if (!chamado) throw new Error('Chamado criado, mas não foi encontrado para retorno.')
  return chamado
}

export async function atualizarChamadoNoBanco(
  id: string,
  payload: Record<string, unknown>
): Promise<ChamadoTransporte> {
  const { error } = await supabase
    .from('chamados')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error

  const chamado = await buscarChamadoPorId(id)
  if (!chamado) throw new Error('Chamado atualizado, mas não foi encontrado para retorno.')
  return chamado
}

export async function registrarHistorico(input: {
  chamadoId: string
  statusAnterior: string | null
  statusNovo: string
  usuarioId?: string | null
  usuarioNome?: string | null
  observacao?: string | null
}) {
  const { error } = await supabase.from('historico_status').insert({
    chamado_id: input.chamadoId,
    status_anterior: input.statusAnterior,
    status_novo: input.statusNovo,
    usuario_id: input.usuarioId ?? null,
    usuario_nome: input.usuarioNome ?? null,
    observacao: input.observacao ?? null
  })

  if (error) throw error
}
