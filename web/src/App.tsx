import { useMemo, useState } from 'react'
import { chamadosIniciais, setores } from './data/mockData'
import { ChamadoTransporte, ChecklistTransporte, PrioridadeOperacional, RiscoTransporte, Setor } from './domain/types'

type Tela = 'LOGIN' | 'DASHBOARD' | 'CRIAR_CHAMADO' | 'DETALHE_CHAMADO'

type NovoChamadoForm = {
  pacienteCodigoOuIniciais: string
  origemId: string
  destinoId: string
  tipoTransporte: string
  prioridade: PrioridadeOperacional
  risco: RiscoTransporte
  observacoes: string
  checklist: ChecklistTransporte
}

const checklistInicial: ChecklistTransporte = {
  pacienteIdentificado: false,
  origemDestinoConfirmados: false,
  destinoComunicado: false,
  equipeMinimaConfirmada: false,
  oxigenioEquipamento: 'NAO_SE_APLICA',
  precaucaoInfeccao: 'PADRAO'
}

const formInicial: NovoChamadoForm = {
  pacienteCodigoOuIniciais: '',
  origemId: '3',
  destinoId: '2',
  tipoTransporte: 'Maca',
  prioridade: 'NORMAL',
  risco: 'BAIXO',
  observacoes: '',
  checklist: checklistInicial
}

function gerarNumero(chamados: ChamadoTransporte[]) {
  const maior = chamados.reduce((acc, chamado) => {
    const numero = Number(chamado.numero)
    return Number.isNaN(numero) ? acc : Math.max(acc, numero)
  }, 139)

  return String(maior + 1).padStart(6, '0')
}

function buscarSetor(id: string): Setor {
  const setor = setores.find(item => item.id === id)
  if (!setor) return setores[0]
  return setor
}

export function App() {
  const [tela, setTela] = useState<Tela>('LOGIN')
  const [usuario, setUsuario] = useState('')
  const [chamados, setChamados] = useState<ChamadoTransporte[]>(chamadosIniciais)
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoTransporte | null>(null)
  const [form, setForm] = useState<NovoChamadoForm>(formInicial)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const indicadores = useMemo(() => {
    return {
      abertos: chamados.filter(c => c.status !== 'CONCLUIDO_ENTREGUE' && c.status !== 'CANCELADO').length,
      aguardando: chamados.filter(c => c.status === 'AGUARDANDO_MAQUEIRO').length,
      emTransito: chamados.filter(c => c.status === 'EM_TRANSITO').length,
      concluidos: chamados.filter(c => c.status === 'CONCLUIDO_ENTREGUE').length
    }
  }, [chamados])

  function fazerLogin() {
    setUsuario(usuario.trim() || 'Enf. Ana')
    setTela('DASHBOARD')
  }

  function atualizarChecklist(campo: keyof ChecklistTransporte, valor: boolean | string) {
    setForm(atual => ({
      ...atual,
      checklist: {
        ...atual.checklist,
        [campo]: valor
      }
    }))
  }

  function checklistObrigatorioOk() {
    return (
      form.checklist.pacienteIdentificado &&
      form.checklist.origemDestinoConfirmados &&
      form.checklist.equipeMinimaConfirmada
    )
  }

  function camposObrigatoriosOk() {
    return (
      form.pacienteCodigoOuIniciais.trim().length > 0 &&
      form.origemId !== form.destinoId &&
      form.tipoTransporte.trim().length > 0
    )
  }

  function criarChamado() {
    if (!camposObrigatoriosOk() || !checklistObrigatorioOk()) {
      setMensagem('Preencha os campos obrigatórios e confirme o checklist mínimo.')
      return
    }

    const origem = buscarSetor(form.origemId)
    const destino = buscarSetor(form.destinoId)

    const novoChamado: ChamadoTransporte = {
      id: `c_${Date.now()}`,
      numero: gerarNumero(chamados),
      pacienteCodigoOuIniciais: form.pacienteCodigoOuIniciais.trim(),
      origem,
      destino,
      tipoTransporte: form.tipoTransporte.trim(),
      prioridade: form.prioridade,
      risco: form.risco,
      status: 'AGUARDANDO_MAQUEIRO',
      solicitante: usuario || 'Enfermagem',
      criadoEm: 'Agora',
      observacoes: form.observacoes.trim(),
      checklist: form.checklist
    }

    setChamados(atual => [novoChamado, ...atual])
    setChamadoSelecionado(novoChamado)
    setMensagem(`Chamado #${novoChamado.numero} criado com sucesso. Agora ele ficará disponível para o app mobile do maqueiro.`)
    setForm(formInicial)
    setTela('DETALHE_CHAMADO')
  }

  if (tela === 'LOGIN') {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="brand-mark">MC</div>
          <h1>MoverCare Web</h1>
          <p>Painel da enfermagem para criação e acompanhamento de chamados.</p>

          <label>
            Usuário
            <input value={usuario} onChange={event => setUsuario(event.target.value)} placeholder="Ex.: Enf. Ana" />
          </label>

          <label>
            Senha
            <input type="password" placeholder="Qualquer senha para teste" />
          </label>

          <button className="primary-button" onClick={fazerLogin}>Entrar</button>
        </section>
      </main>
    )
  }

  if (tela === 'CRIAR_CHAMADO') {
    return (
      <main className="app-shell">
        <TopBar usuario={usuario} onVoltar={() => setTela('DASHBOARD')} />

        <section className="page-header">
          <div>
            <h1>Criar chamado de transporte</h1>
            <p>Preencha somente os dados operacionais necessários para o transporte seguro.</p>
          </div>
        </section>

        {mensagem && <Alert text={mensagem} onClose={() => setMensagem(null)} />}

        <section className="form-grid">
          <div className="panel">
            <h2>Dados do transporte</h2>

            <label>
              Paciente: código ou iniciais
              <input
                value={form.pacienteCodigoOuIniciais}
                onChange={event => setForm({ ...form, pacienteCodigoOuIniciais: event.target.value })}
                placeholder="Ex.: PAC-2048 ou J.S."
              />
            </label>

            <div className="two-columns">
              <label>
                Origem
                <select value={form.origemId} onChange={event => setForm({ ...form, origemId: event.target.value })}>
                  {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                </select>
              </label>

              <label>
                Destino
                <select value={form.destinoId} onChange={event => setForm({ ...form, destinoId: event.target.value })}>
                  {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                </select>
              </label>
            </div>

            <label>
              Tipo de transporte
              <select value={form.tipoTransporte} onChange={event => setForm({ ...form, tipoTransporte: event.target.value })}>
                <option>Maca</option>
                <option>Cadeira de rodas</option>
                <option>Acompanhamento</option>
                <option>Outro autorizado</option>
              </select>
            </label>

            <div className="two-columns">
              <label>
                Prioridade operacional
                <select
                  value={form.prioridade}
                  onChange={event => setForm({ ...form, prioridade: event.target.value as PrioridadeOperacional })}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENTE">Urgente</option>
                  <option value="CRITICO">Crítico</option>
                </select>
              </label>

              <label>
                Risco do transporte
                <select
                  value={form.risco}
                  onChange={event => setForm({ ...form, risco: event.target.value as RiscoTransporte })}
                >
                  <option value="BAIXO">Baixo</option>
                  <option value="MEDIO">Médio</option>
                  <option value="ALTO">Alto</option>
                </select>
              </label>
            </div>

            <label>
              Observações operacionais
              <textarea
                value={form.observacoes}
                onChange={event => setForm({ ...form, observacoes: event.target.value })}
                placeholder="Ex.: transporte com oxigênio, atenção ao isolamento, destino já comunicado..."
              />
            </label>
          </div>

          <div className="panel">
            <h2>Checklist pré-transporte</h2>

            <CheckItem
              label="Paciente identificado"
              checked={form.checklist.pacienteIdentificado}
              onChange={valor => atualizarChecklist('pacienteIdentificado', valor)}
            />

            <CheckItem
              label="Origem e destino confirmados"
              checked={form.checklist.origemDestinoConfirmados}
              onChange={valor => atualizarChecklist('origemDestinoConfirmados', valor)}
            />

            <CheckItem
              label="Destino comunicado"
              checked={form.checklist.destinoComunicado}
              onChange={valor => atualizarChecklist('destinoComunicado', valor)}
            />

            <CheckItem
              label="Equipe mínima confirmada"
              checked={form.checklist.equipeMinimaConfirmada}
              onChange={valor => atualizarChecklist('equipeMinimaConfirmada', valor)}
            />

            <label>
              Oxigênio/equipamento
              <select
                value={form.checklist.oxigenioEquipamento}
                onChange={event => atualizarChecklist('oxigenioEquipamento', event.target.value)}
              >
                <option value="SIM">Sim</option>
                <option value="NAO">Não</option>
                <option value="NAO_SE_APLICA">Não se aplica</option>
              </select>
            </label>

            <label>
              Precaução de infecção
              <select
                value={form.checklist.precaucaoInfeccao}
                onChange={event => atualizarChecklist('precaucaoInfeccao', event.target.value)}
              >
                <option value="PADRAO">Padrão</option>
                <option value="CONTATO">Contato</option>
                <option value="GOTICULA">Gotícula</option>
                <option value="AEROSSOL">Aerossol</option>
                <option value="REVERSO">Reverso</option>
              </select>
            </label>

            {(form.risco === 'MEDIO' || form.risco === 'ALTO') && (
              <div className="warning-box">
                Risco médio/alto: confirme equipe assistencial necessária antes de liberar o chamado.
              </div>
            )}

            <div className="button-row">
              <button className="secondary-button" onClick={() => setTela('DASHBOARD')}>Cancelar</button>
              <button className="primary-button" onClick={criarChamado}>Criar chamado</button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (tela === 'DETALHE_CHAMADO' && chamadoSelecionado) {
    return (
      <main className="app-shell">
        <TopBar usuario={usuario} onVoltar={() => setTela('DASHBOARD')} />

        {mensagem && <Alert text={mensagem} onClose={() => setMensagem(null)} />}

        <section className="detail-card">
          <span className={`status ${chamadoSelecionado.status.toLowerCase()}`}>{chamadoSelecionado.status}</span>
          <h1>Chamado #{chamadoSelecionado.numero}</h1>
          <p className="route">{chamadoSelecionado.origem.nome} → {chamadoSelecionado.destino.nome}</p>

          <div className="detail-grid">
            <Info label="Paciente" value={chamadoSelecionado.pacienteCodigoOuIniciais} />
            <Info label="Tipo" value={chamadoSelecionado.tipoTransporte} />
            <Info label="Prioridade" value={chamadoSelecionado.prioridade} />
            <Info label="Risco" value={chamadoSelecionado.risco} />
            <Info label="Solicitante" value={chamadoSelecionado.solicitante} />
            <Info label="Criado em" value={chamadoSelecionado.criadoEm} />
            <Info label="QR origem" value={chamadoSelecionado.origem.qrCodeId} />
            <Info label="QR destino" value={chamadoSelecionado.destino.qrCodeId} />
          </div>

          <h2>Observações</h2>
          <p>{chamadoSelecionado.observacoes || 'Sem observações.'}</p>

          <button className="primary-button" onClick={() => setTela('DASHBOARD')}>Voltar ao painel</button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <TopBar usuario={usuario} onVoltar={() => setTela('LOGIN')} />

      <section className="page-header">
        <div>
          <h1>Painel da Enfermagem</h1>
          <p>Crie chamados e acompanhe o transporte intra-hospitalar em tempo real.</p>
        </div>

        <button className="primary-button" onClick={() => {
          setMensagem(null)
          setTela('CRIAR_CHAMADO')
        }}>
          + Novo chamado
        </button>
      </section>

      <section className="metrics">
        <Metric title="Em aberto" value={indicadores.abertos} />
        <Metric title="Aguardando maqueiro" value={indicadores.aguardando} />
        <Metric title="Em trânsito" value={indicadores.emTransito} />
        <Metric title="Concluídos" value={indicadores.concluidos} />
      </section>

      <section className="panel">
        <h2>Chamados recentes</h2>

        <div className="table">
          <div className="table-row table-head">
            <span>Número</span>
            <span>Rota</span>
            <span>Prioridade</span>
            <span>Risco</span>
            <span>Status</span>
          </div>

          {chamados.map(chamado => (
            <button
              key={chamado.id}
              className="table-row table-button"
              onClick={() => {
                setChamadoSelecionado(chamado)
                setTela('DETALHE_CHAMADO')
              }}
            >
              <span>#{chamado.numero}</span>
              <span>{chamado.origem.nome} → {chamado.destino.nome}</span>
              <span>{chamado.prioridade}</span>
              <span>{chamado.risco}</span>
              <span className={`status ${chamado.status.toLowerCase()}`}>{chamado.status}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function TopBar({ usuario, onVoltar }: { usuario: string, onVoltar: () => void }) {
  return (
    <header className="topbar">
      <div>
        <strong>MoverCare Web</strong>
        <span>Gestão de transporte intra-hospitalar</span>
      </div>

      <div className="topbar-right">
        <span>{usuario || 'Usuário'}</span>
        <button className="ghost-button" onClick={onVoltar}>Sair/Voltar</button>
      </div>
    </header>
  )
}

function Metric({ title, value }: { title: string, value: number }) {
  return (
    <article className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  )
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (value: boolean) => void }) {
  return (
    <label className="check-item">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    </label>
  )
}

function Info({ label, value }: { label: string, value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Alert({ text, onClose }: { text: string, onClose: () => void }) {
  return (
    <div className="alert">
      <span>{text}</span>
      <button onClick={onClose}>OK</button>
    </div>
  )
}
