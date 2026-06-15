import { ChamadoTransporte, Setor } from '../domain/types'

export const setores: Setor[] = [
  { id: '1', nome: 'PA', ordemRota: 1, qrCodeId: 'QR_PA' },
  { id: '2', nome: 'Centro Cirúrgico', ordemRota: 2, qrCodeId: 'QR_CC' },
  { id: '3', nome: 'Ala 2', ordemRota: 3, qrCodeId: 'QR_ALA_2' },
  { id: '4', nome: 'Ala 3', ordemRota: 4, qrCodeId: 'QR_ALA_3' },
  { id: '5', nome: 'Ala 4', ordemRota: 5, qrCodeId: 'QR_ALA_4' },
  { id: '15', nome: 'Enfermaria', ordemRota: 15, qrCodeId: 'QR_ENFERMARIA' }
]

export const chamadosIniciais: ChamadoTransporte[] = [
  {
    id: 'c1',
    numero: '000138',
    pacienteCodigoOuIniciais: 'PAC-2048',
    origem: setores[2],
    destino: setores[1],
    tipoTransporte: 'Maca',
    prioridade: 'URGENTE',
    risco: 'MEDIO',
    status: 'AGUARDANDO_MAQUEIRO',
    solicitante: 'Enf. Ana',
    criadoEm: 'Hoje 08:42',
    observacoes: 'Paciente com necessidade de transporte assistido.',
    checklist: {
      pacienteIdentificado: true,
      origemDestinoConfirmados: true,
      destinoComunicado: true,
      equipeMinimaConfirmada: true,
      oxigenioEquipamento: 'NAO',
      precaucaoInfeccao: 'PADRAO'
    }
  },
  {
    id: 'c2',
    numero: '000139',
    pacienteCodigoOuIniciais: 'J.S.',
    origem: setores[0],
    destino: setores[2],
    tipoTransporte: 'Cadeira de rodas',
    prioridade: 'NORMAL',
    risco: 'BAIXO',
    status: 'EM_TRANSITO',
    solicitante: 'Enf. Camila',
    maqueiroResponsavel: 'Carlos Silva',
    criadoEm: 'Hoje 09:05',
    observacoes: '',
    checklist: {
      pacienteIdentificado: true,
      origemDestinoConfirmados: true,
      destinoComunicado: true,
      equipeMinimaConfirmada: true,
      oxigenioEquipamento: 'NAO_SE_APLICA',
      precaucaoInfeccao: 'PADRAO'
    }
  }
]
