import cors from 'cors'
import express from 'express'

import {
  listarChamados,
  criarChamadoNoBanco,
  buscarChamadoPorId,
  listarSetores,
  buscarUsuarioPorLogin,
  buscarUsuarioPorId,
  buscarPrimeiroUsuarioPorPerfil,
  atualizarChamadoNoBanco,
  registrarHistorico
} from './repositories/moverCareRepository.js'

import { badRequest, notFound, serverError } from './utils/http.js'

const app = express()
const port = Number(process.env.PORT ?? 3333)

app.use(cors())
app.use(express.json())

// HEALTH
app.get('/health', (_req, res) => {
  return res.json({
    ok: true,
    app: 'MoverCare API',
    version: '0.2.0',
    database: 'supabase'
  })
})

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { login } = req.body

    if (!login) return badRequest(res, 'Informe o login.')

    const usuario = await buscarUsuarioPorLogin(login)

    if (!usuario) {
      return badRequest(res, 'Usuário não encontrado.')
    }

    return res.json({ ok: true, usuario })
  } catch (error) {
    return serverError(res, error)
  }
})

// USUARIOS (debug)
app.get('/usuarios', async (_req, res) => {
  try {
    const usuarios = await listarChamados()
    return res.json({ ok: true, usuarios })
  } catch (error) {
    return serverError(res, error)
  }
})

// SETORES
app.get('/setores', async (_req, res) => {
  try {
    const setores = await listarSetores()
    return res.json({ ok: true, setores })
  } catch (error) {
    return serverError(res, error)
  }
})

// CHAMADOS LISTA
app.get('/chamados', async (_req, res) => {
  try {
    const chamados = await listarChamados()
    return res.json({ ok: true, chamados })
  } catch (error) {
    return serverError(res, error)
  }
})

// CHAMADO POR ID
app.get('/chamados/:id', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    return res.json({ ok: true, chamado })
  } catch (error) {
    return serverError(res, error)
  }
})

// CRIAR CHAMADO
app.post('/chamados', async (req, res) => {
  try {
    const body = req.body

    if (
      !body.pacienteCodigoOuIniciais ||
      !body.origemId ||
      !body.destinoId ||
      !body.tipoTransporte
    ) {
      return badRequest(res, 'Preencha os campos obrigatórios.')
    }

    if (body.origemId === body.destinoId) {
      return badRequest(res, 'Origem e destino não podem ser iguais.')
    }

    if (!body.checklist) {
      return badRequest(res, 'Checklist obrigatório.')
    }

    let solicitante = body.solicitanteId
      ? await buscarUsuarioPorId(body.solicitanteId)
      : null

    if (!solicitante) {
      solicitante = await buscarPrimeiroUsuarioPorPerfil('ENFERMAGEM')
    }

    if (!solicitante) {
      return badRequest(res, 'Solicitante não encontrado.')
    }

    const chamado = await criarChamadoNoBanco({
      pacienteCodigoOuIniciais: body.pacienteCodigoOuIniciais,
      origemId: body.origemId,
      destinoId: body.destinoId,
      tipoTransporte: body.tipoTransporte,
      prioridade: body.prioridade ?? 'NORMAL',
      risco: body.risco ?? 'BAIXO',
      solicitanteId: solicitante.id,
      solicitanteNome: solicitante.nome,
      observacoes: body.observacoes ?? '',
      checklist: body.checklist
    })

    return res.status(201).json({ ok: true, chamado })
  } catch (error) {
    return serverError(res, error)
  }
})

// ACEITAR
app.post('/chamados/:id/aceitar', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    const maqueiro =
      req.body.maqueiroId
        ? await buscarUsuarioPorId(req.body.maqueiroId)
        : await buscarPrimeiroUsuarioPorPerfil('MAQUEIRO')

    if (!maqueiro) return badRequest(res, 'Maqueiro não encontrado.')

    const atualizado = await atualizarChamadoNoBanco(chamado.id, {
      status: 'A_CAMINHO_DA_ORIGEM',
      maqueiro_responsavel_id: maqueiro.id,
      maqueiro_responsavel_nome: maqueiro.nome,
      horario_aceite: new Date().toISOString()
    })

    await registrarHistorico({
      chamadoId: chamado.id,
      statusAnterior: chamado.status,
      statusNovo: 'A_CAMINHO_DA_ORIGEM',
      usuarioId: maqueiro.id,
      usuarioNome: maqueiro.nome,
      observacao: 'Chamado aceito'
    })

    return res.json({ ok: true, chamado: atualizado })
  } catch (error) {
    return serverError(res, error)
  }
})

// VALIDAR QR
app.post('/chamados/:id/validar-qr', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    const { qrCode } = req.body

    if (!qrCode) return badRequest(res, 'QR inválido.')

    const agora = new Date().toISOString()

    if (chamado.status === 'A_CAMINHO_DA_ORIGEM') {
      if (qrCode !== chamado.origem.qrCodeId) {
        return badRequest(res, 'QR origem inválido.')
      }

      const atualizado = await atualizarChamadoNoBanco(chamado.id, {
        status: 'EM_TRANSITO',
        horario_qr_origem: agora
      })

      return res.json({ ok: true, chamado: atualizado })
    }

    if (chamado.status === 'EM_TRANSITO') {
      if (qrCode !== chamado.destino.qrCodeId) {
        return badRequest(res, 'QR destino inválido.')
      }

      const atualizado = await atualizarChamadoNoBanco(chamado.id, {
        status: 'CONCLUIDO_ENTREGUE',
        horario_qr_destino: agora,
        horario_conclusao: agora
      })

      return res.json({ ok: true, chamado: atualizado })
    }

    return badRequest(res, 'Status inválido para QR.')
  } catch (error) {
    return serverError(res, error)
  }
})

// CANCELAR
app.post('/chamados/:id/cancelar', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    const { motivo } = req.body

    if (!motivo) return badRequest(res, 'Informe motivo.')

    const atualizado = await atualizarChamadoNoBanco(chamado.id, {
      status: 'CANCELADO',
      motivo_cancelamento: motivo
    })

    return res.json({ ok: true, chamado: atualizado })
  } catch (error) {
    return serverError(res, error)
  }
})

app.listen(port, () => {
  console.log(`🚀 MoverCare API Supabase rodando na porta ${port}`)
})