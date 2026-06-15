import { ChamadoTransporte, Setor, Usuario } from '../domain/types.js'

export const usuarios: Usuario[] = [
  { id: 'u1', nome: 'Enf. Ana', login: 'enf', perfil: 'ENFERMAGEM', setorVinculado: 'Ala 2', ativo: true },
  { id: 'u2', nome: 'Carlos Silva', login: 'maq', perfil: 'MAQUEIRO', setorVinculado: 'PA', ativo: true },
  { id: 'u3', nome: 'Coordenação', login: 'coord', perfil: 'COORDENADOR', ativo: true },
  { id: 'u4', nome: 'Administrador', login: 'admin', perfil: 'ADMINISTRADOR', ativo: true }
]

export const setores: Setor[] = [
  { id: '1', nome: 'PA', ordemRota: 1, qrCodeId: 'QR_PA', ativo: true },
  { id: '2', nome: 'Centro Cirúrgico', ordemRota: 2, qrCodeId: 'QR_CC', ativo: true },
  { id: '3', nome: 'Ala 2', ordemRota: 3, qrCodeId: 'QR_ALA_2', ativo: true },
  { id: '4', nome: 'Ala 3', ordemRota: 4, qrCodeId: 'QR_ALA_3', ativo: true },
  { id: '5', nome: 'Ala 4', ordemRota: 5, qrCodeId: 'QR_ALA_4', ativo: true },
  { id: '15', nome: 'Enfermaria', ordemRota: 15, qrCodeId: 'QR_ENFERMARIA', ativo: true }
]

const agora = new Date().toISOString()
export let chamados: ChamadoTransporte[] = [{
  id: 'c1', numero: '000138', pacienteCodigoOuIniciais: 'PAC-2048', origem: setores[2], destino: setores[1], tipoTransporte: 'Maca', prioridade: 'URGENTE', risco: 'MEDIO', status: 'AGUARDANDO_MAQUEIRO', solicitanteId: 'u1', solicitanteNome: 'Enf. Ana', criadoEm: agora, atualizadoEm: agora, observacoes: 'Paciente com necessidade de transporte assistido.',
  checklist: { pacienteIdentificado: true, origemDestinoConfirmados: true, destinoComunicado: true, equipeMinimaConfirmada: true, oxigenioEquipamento: 'NAO', precaucaoInfeccao: 'PADRAO' }, tentativasQrInvalidas: []
}]
export function setChamados(novosChamados: ChamadoTransporte[]) { chamados = novosChamados }
