import cors from 'cors'
import express from 'express'
import { chamados, setChamados, setores, usuarios } from './data/mockDatabase.js'
import { ChamadoTransporte, ChecklistTransporte, PrioridadeOperacional, RiscoTransporte } from './domain/types.js'
import { badRequest, notFound } from './utils/http.js'

const app = express()
const port = 3333
app.use(cors())
app.use(express.json())

function gerarNumero() {
  const maior = chamados.reduce((acc, chamado) => {
    const numero = Number(chamado.numero)
    return Number.isNaN(numero) ? acc : Math.max(acc, numero)
  }, 139)
  return String(maior + 1).padStart(6, '0')
}
function getChamado(id: string) { return chamados.find(chamado => chamado.id === id) }
function atualizarChamado(chamadoAtualizado: ChamadoTransporte) { setChamados(chamados.map(c => c.id === chamadoAtualizado.id ? chamadoAtualizado : c)) }
function validarChecklist(checklist: ChecklistTransporte) { return checklist.pacienteIdentificado && checklist.origemDestinoConfirmados && checklist.equipeMinimaConfirmada }

app.get('/health', (_req, res) => res.json({ ok: true, app: 'MoverCare API', version: '0.1.0' }))
app.post('/login', (req, res) => {
  const { login } = req.body as { login?: string }
  if (!login) return badRequest(res, 'Informe o login.')
  const usuario = usuarios.find(u => u.login.toLowerCase() === login.toLowerCase())
  if (!usuario) return badRequest(res, 'Usuário não encontrado no ambiente de teste.')
  return res.json({ ok: true, usuario })
})
app.get('/usuarios', (_req, res) => res.json({ ok: true, usuarios }))
app.get('/setores', (_req, res) => res.json({ ok: true, setores }))
app.get('/indicadores', (_req, res) => res.json({ ok: true, indicadores: { abertos: chamados.filter(c => c.status !== 'CONCLUIDO_ENTREGUE' && c.status !== 'CANCELADO').length, aguardandoMaqueiro: chamados.filter(c => c.status === 'AGUARDANDO_MAQUEIRO').length, emTransito: chamados.filter(c => c.status === 'EM_TRANSITO').length, concluidos: chamados.filter(c => c.status === 'CONCLUIDO_ENTREGUE').length, cancelados: chamados.filter(c => c.status === 'CANCELADO').length } }))
app.get('/chamados', (_req, res) => res.json({ ok: true, chamados }))
app.get('/chamados/:id', (req, res) => {
  const chamado = getChamado(req.params.id)
  if (!chamado) return notFound(res, 'Chamado não encontrado.')
  return res.json({ ok: true, chamado })
})
app.post('/chamados', (req, res) => {
  const body = req.body as { pacienteCodigoOuIniciais?: string; origemId?: string; destinoId?: string; tipoTransporte?: string; prioridade?: PrioridadeOperacional; risco?: RiscoTransporte; solicitanteId?: string; observacoes?: string; checklist?: ChecklistTransporte }
  if (!body.pacienteCodigoOuIniciais || !body.origemId || !body.destinoId || !body.tipoTransporte) return badRequest(res, 'Preencha paciente, origem, destino e tipo de transporte.')
  if (body.origemId === body.destinoId) return badRequest(res, 'Origem e destino não podem ser iguais.')
  if (!body.checklist || !validarChecklist(body.checklist)) return badRequest(res, 'Checklist mínimo obrigatório não confirmado.')
  const origem = setores.find(s => s.id === body.origemId)
  const destino = setores.find(s => s.id === body.destinoId)
  const solicitante = usuarios.find(u => u.id === body.solicitanteId) ?? usuarios[0]
  if (!origem || !destino) return badRequest(res, 'Origem ou destino inválido.')
  const agora = new Date().toISOString()
  const novoChamado: ChamadoTransporte = { id: `c_${Date.now()}`, numero: gerarNumero(), pacienteCodigoOuIniciais: body.pacienteCodigoOuIniciais, origem, destino, tipoTransporte: body.tipoTransporte, prioridade: body.prioridade ?? 'NORMAL', risco: body.risco ?? 'BAIXO', status: 'AGUARDANDO_MAQUEIRO', solicitanteId: solicitante.id, solicitanteNome: solicitante.nome, criadoEm: agora, atualizadoEm: agora, observacoes: body.observacoes ?? '', checklist: body.checklist, tentativasQrInvalidas: [] }
  setChamados([novoChamado, ...chamados])
  return res.status(201).json({ ok: true, chamado: novoChamado })
})
app.post('/chamados/:id/aceitar', (req, res) => {
  const chamado = getChamado(req.params.id)
  const { maqueiroId } = req.body as { maqueiroId?: string }
  if (!chamado) return notFound(res, 'Chamado não encontrado.')
  if (chamado.status !== 'AGUARDANDO_MAQUEIRO' && chamado.status !== 'ENVIADO') return badRequest(res, 'Este chamado não está disponível para aceite.')
  const maqueiro = usuarios.find(u => u.id === maqueiroId && u.perfil === 'MAQUEIRO') ?? usuarios[1]
  const agora = new Date().toISOString()
  const atualizado: ChamadoTransporte = { ...chamado, status: 'A_CAMINHO_DA_ORIGEM', maqueiroResponsavelId: maqueiro.id, maqueiroResponsavelNome: maqueiro.nome, horarioAceite: agora, atualizadoEm: agora }
  atualizarChamado(atualizado)
  return res.json({ ok: true, chamado: atualizado })
})
app.post('/chamados/:id/recusar', (req, res) => {
  const chamado = getChamado(req.params.id)
  const { motivo } = req.body as { motivo?: string }
  if (!chamado) return notFound(res, 'Chamado não encontrado.')
  if (!motivo || motivo.trim().length < 3) return badRequest(res, 'Informe o motivo da recusa.')
  const atualizado: ChamadoTransporte = { ...chamado, status: 'AGUARDANDO_MAQUEIRO', motivoRecusa: motivo, atualizadoEm: new Date().toISOString() }
  atualizarChamado(atualizado)
  return res.json({ ok: true, chamado: atualizado })
})
app.post('/chamados/:id/validar-qr', (req, res) => {
  const chamado = getChamado(req.params.id)
  const { qrCode } = req.body as { qrCode?: string }
  if (!chamado) return notFound(res, 'Chamado não encontrado.')
  if (!qrCode) return badRequest(res, 'Informe o QR Code lido.')
  const agora = new Date().toISOString()
  if (chamado.status === 'A_CAMINHO_DA_ORIGEM') {
    if (qrCode !== chamado.origem.qrCodeId) {
      const atualizado = { ...chamado, atualizadoEm: agora, tentativasQrInvalidas: [...chamado.tentativasQrInvalidas, { valorLido: qrCode, etapa: 'ORIGEM', criadoEm: agora }] }
      atualizarChamado(atualizado)
      return badRequest(res, `QR incorreto. Esperado: ${chamado.origem.nome}.`)
    }
    const atualizado: ChamadoTransporte = { ...chamado, status: 'EM_TRANSITO', horarioQrOrigem: agora, atualizadoEm: agora }
    atualizarChamado(atualizado)
    return res.json({ ok: true, message: 'QR de origem validado. Status alterado para Em trânsito.', chamado: atualizado })
  }
  if (chamado.status === 'EM_TRANSITO') {
    if (qrCode !== chamado.destino.qrCodeId) {
      const atualizado = { ...chamado, atualizadoEm: agora, tentativasQrInvalidas: [...chamado.tentativasQrInvalidas, { valorLido: qrCode, etapa: 'DESTINO', criadoEm: agora }] }
      atualizarChamado(atualizado)
      return badRequest(res, `QR incorreto. Esperado: ${chamado.destino.nome}.`)
    }
    const atualizado: ChamadoTransporte = { ...chamado, status: 'CONCLUIDO_ENTREGUE', horarioQrDestino: agora, horarioConclusao: agora, atualizadoEm: agora }
    atualizarChamado(atualizado)
    return res.json({ ok: true, message: 'QR de destino validado. Chamado concluído.', chamado: atualizado })
  }
  return badRequest(res, 'Este chamado não está em uma etapa que permite leitura de QR Code.')
})
app.post('/chamados/:id/cancelar', (req, res) => {
  const chamado = getChamado(req.params.id)
  const { motivo } = req.body as { motivo?: string }
  if (!chamado) return notFound(res, 'Chamado não encontrado.')
  if (!motivo || motivo.trim().length < 3) return badRequest(res, 'Informe o motivo do cancelamento.')
  if (chamado.status === 'CONCLUIDO_ENTREGUE') return badRequest(res, 'Chamados concluídos não podem ser cancelados.')
  const atualizado: ChamadoTransporte = { ...chamado, status: 'CANCELADO', motivoCancelamento: motivo, atualizadoEm: new Date().toISOString() }
  atualizarChamado(atualizado)
  return res.json({ ok: true, chamado: atualizado })
})
app.listen(port, () => console.log(`MoverCare API rodando em http://localhost:${port}`))
