import cors from 'cors'
import express from 'express'
import {
  atualizarChamadoNoBanco,
  buscarChamadoPorId,
  buscarPrimeiroUsuarioPorPerfil,
  buscarUsuarioPorId,
  buscarUsuarioPorLogin,
  criarChamadoNoBanco,
  listarChamados,
  listarSetores,
  listarUsuarios,
  registrarHistorico
} from './repositories/moverCareRepository.js'
import { ChecklistTransporte, PrioridadeOperacional, RiscoTransporte } from './domain/types.js'
import { badRequest, notFound, serverError } from './utils/http.js'

const app = express()
const port = Number(process.env.PORT ?? 3333)

app.use(cors())
app.use(express.json())

function validarChecklist(checklist: ChecklistTransporte) {
  return checklist.pacienteIdentificado &&
    checklist.origemDestinoConfirmados &&
    checklist.equipeMinimaConfirmada
}

app.get('/health', (_req, res) => {
  return res.json({
    ok: true,
    app: 'MoverCare API',
    version: '0.2.0',
    database: 'supabase'
  })
})

app.post('/login', async (req, res) => {
  try {
    const { login } = req.body as { login?: string }

    if (!login) return badRequest(res, 'Informe o login.')

    const usuario = await buscarUsuarioPorLogin(login)

    if (!usuario) {
      return badRequest(res, 'Usuário não encontrado no Supabase.')
    }

    return res.json({ ok: true, usuario })
  } catch (error) {
    return serverError(res, error)
  }
})

app.get('/usuarios', async (_req, res) => {
  try {
    const usuarios = await listarUsuarios()
    return res.json({ ok: true, usuarios })
  } catch (error) {
    return serverError(res, error)
  }
})

app.get('/setores', async (_req, res) => {
  try {
    const setores = await listarSetores()
    return res.json({ ok: true, setores })
  } catch (error) {
    return serverError(res, error)
  }
})

app.get('/indicadores', async (_req, res) => {
  try {
    const chamados = await listarChamados()

    return res.json({
      ok: true,
      indicadores: {
        abertos: chamados.filter(c => c.status !== 'CONCLUIDO_ENTREGUE' && c.status !== 'CANCELADO').length,
        aguardandoMaqueiro: chamados.filter(c => c.status === 'AGUARDANDO_MAQUEIRO').length,
        emTransito: chamados.filter(c => c.status === 'EM_TRANSITO').length,
        concluidos: chamados.filter(c => c.status === 'CONCLUIDO_ENTREGUE').length,
        cancelados: chamados.filter(c => c.status === 'CANCELADO').length
      }
    })
  } catch (error) {
    return serverError(res, error)
  }
})

app.get('/chamados', async (_req, res) => {
  try {
    const chamados = await listarChamados()
    return res.json({ ok: true, chamados })
  } catch (error) {
    return serverError(res, error)
  }
})

app.get('/chamados/:id', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    return res.json({ ok: true, chamado })
  } catch (error) {
    return serverError(res, error)
  }
})

app.post('/chamados', async (req, res) => {
  try {
    const body = req.body as {
      pacienteCodigoOuIniciais?: string
      origemId?: string
      destinoId?: string
      tipoTransporte?: string
      prioridade?: PrioridadeOperacional
      risco?: RiscoTransporte
      solicitanteId?: string
      observacoes?: string
      checklist?: ChecklistTransporte
    }

    if (!body.pacienteCodigoOuIniciais || !body.origemId || !body.destinoId || !body.tipoTransporte) {
      return badRequest(res, 'Preencha paciente, origem, destino e tipo de transporte.')
    }

    if (body.origemId === body.destinoId) {
      return badRequest(res, 'Origem e destino não podem ser iguais.')
    }

    if (!body.checklist || !validarChecklist(body.checklist)) {
      return badRequest(res, 'Checklist mínimo obrigatório não confirmado.')
    }

    const setores = await listarSetores()
    const origem = setores.find(s => s.id === body.origemId)
    const destino = setores.find(s => s.id === body.destinoId)

    if (!origem || !destino) {
      return badRequest(res, 'Origem ou destino inválido.')
    }

    let solicitante = body.solicitanteId ? await buscarUsuarioPorId(body.solicitanteId) : null

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

app.post('/chamados/:id/aceitar', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)
    const { maqueiroId } = req.body as { maqueiroId?: string }

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    if (chamado.status !== 'AGUARDANDO_MAQUEIRO' && chamado.status !== 'ENVIADO') {
      return badRequest(res, 'Este chamado não está disponível para aceite.')
    }

    let maqueiro = maqueiroId ? await buscarUsuarioPorId(maqueiroId) : null

    if (!maqueiro || maqueiro.perfil !== 'MAQUEIRO') {
      maqueiro = await buscarPrimeiroUsuarioPorPerfil('MAQUEIRO')
    }

    if (!maqueiro) {
      return badRequest(res, 'Maqueiro não encontrado.')
    }

    const agora = new Date().toISOString()

    const atualizado = await atualizarChamadoNoBanco(chamado.id, {
      status: 'A_CAMINHO_DA_ORIGEM',
      maqueiro_responsavel_id: maqueiro.id,
      maqueiro_responsavel_nome: maqueiro.nome,
      horario_aceite: agora
    })

    await registrarHistorico({
      chamadoId: chamado.id,
      statusAnterior: chamado.status,
      statusNovo: 'A_CAMINHO_DA_ORIGEM',
      usuarioId: maqueiro.id,
      usuarioNome: maqueiro.nome,
      observacao: 'Chamado aceito pelo maqueiro.'
    })

    return res.json({ ok: true, chamado: atualizado })
  } catch (error) {
    return serverError(res, error)
  }
})

app.post('/chamados/:id/recusar', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)
    const { motivo } = req.body as { motivo?: string }

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    if (!motivo || motivo.trim().length < 3) {
      return badRequest(res, 'Informe o motivo da recusa.')
    }

    const atualizado = await atualizarChamadoNoBanco(chamado.id, {
      status: 'AGUARDANDO_MAQUEIRO',
      motivo_recusa: motivo
    })

    await registrarHistorico({
      chamadoId: chamado.id,
      statusAnterior: chamado.status,
      statusNovo: 'AGUARDANDO_MAQUEIRO',
      observacao: `Recusa registrada: ${motivo}`
    })

    return res.json({ ok: true, chamado: atualizado })
  } catch (error) {
    return serverError(res, error)
  }
})

app.post('/chamados/:id/validar-qr', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)
    const { qrCode } = req.body as { qrCode?: string }

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    if (!qrCode) {
      return badRequest(res, 'Informe o QR Code lido.')
    }

    const agora = new Date().toISOString()

    if (chamado.status === 'A_CAMINHO_DA_ORIGEM') {
      if (qrCode !== chamado.origem.qrCodeId) {
        const tentativas = [
          ...chamado.tentativasQrInvalidas,
          { valorLido: qrCode, etapa: 'ORIGEM', criadoEm: agora }
        ]

        await atualizarChamadoNoBanco(chamado.id, {
          tentativas_qr_invalidas: tentativas
        })

        return badRequest(res, `QR incorreto. Esperado: ${chamado.origem.nome}.`)
      }

      const atualizado = await atualizarChamadoNoBanco(chamado.id, {
        status: 'EM_TRANSITO',
        horario_qr_origem: agora
      })

      await registrarHistorico({
        chamadoId: chamado.id,
        statusAnterior: chamado.status,
        statusNovo: 'EM_TRANSITO',
        usuarioId: chamado.maqueiroResponsavelId,
        usuarioNome: chamado.maqueiroResponsavelNome,
        observacao: 'QR da origem validado.'
      })

      return res.json({
        ok: true,
        message: 'QR de origem validado. Status alterado para Em trânsito.',
        chamado: atualizado
      })
    }

    if (chamado.status === 'EM_TRANSITO') {
      if (qrCode !== chamado.destino.qrCodeId) {
        const tentativas = [
          ...chamado.tentativasQrInvalidas,
          { valorLido: qrCode, etapa: 'DESTINO', criadoEm: agora }
        ]

        await atualizarChamadoNoBanco(chamado.id, {
          tentativas_qr_invalidas: tentativas
        })

        return badRequest(res, `QR incorreto. Esperado: ${chamado.destino.nome}.`)
      }

      const atualizado = await atualizarChamadoNoBanco(chamado.id, {
        status: 'CONCLUIDO_ENTREGUE',
        horario_qr_destino: agora,
        horario_conclusao: agora
      })

      await registrarHistorico({
        chamadoId: chamado.id,
        statusAnterior: chamado.status,
        statusNovo: 'CONCLUIDO_ENTREGUE',
        usuarioId: chamado.maqueiroResponsavelId,
        usuarioNome: chamado.maqueiroResponsavelNome,
        observacao: 'QR do destino validado. Transporte concluído.'
      })

      return res.json({
        ok: true,
        message: 'QR de destino validado. Chamado concluído.',
        chamado: atualizado
      })
    }

    return badRequest(res, 'Este chamado não está em uma etapa que permite leitura de QR Code.')
  } catch (error) {
    return serverError(res, error)
  }
})

app.post('/chamados/:id/cancelar', async (req, res) => {
  try {
    const chamado = await buscarChamadoPorId(req.params.id)
    const { motivo } = req.body as { motivo?: string }

    if (!chamado) return notFound(res, 'Chamado não encontrado.')

    if (!motivo || motivo.trim().length < 3) {
      return badRequest(res, 'Informe o motivo do cancelamento.')
    }

    if (chamado.status === 'CONCLUIDO_ENTREGUE') {
      return badRequest(res, 'Chamados concluídos não podem ser cancelados.')
    }

    const atualizado = await atualizarChamadoNoBanco(chamado.id, {
      status: 'CANCELADO',
      motivo_cancelamento: motivo
    })

    await registrarHistorico({
      chamadoId: chamado.id,
      statusAnterior: chamado.status,
      statusNovo: 'CANCELADO',
      observacao: `Chamado cancelado: ${motivo}`
    })

    return res.json({ ok: true, chamado: atualizado })
  } catch (error) {
    return serverError(res, error)
  }
})

app.listen(port, () => {
  console.log(`MoverCare API com Supabase rodando em http://localhost:${port}`)
})
