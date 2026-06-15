import { ChamadoTransporte, ChecklistTransporte, PrioridadeOperacional, RiscoTransporte, Setor, Usuario } from '../domain/types'
const API_URL = 'http://localhost:3333'
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }, ...options })
  const data = await response.json()
  if (!response.ok || data.ok === false) throw new Error(data.message ?? 'Erro na comunicação com a API.')
  return data as T
}
export async function login(login: string) { return request<{ ok: true, usuario: Usuario }>('/login', { method: 'POST', body: JSON.stringify({ login }) }) }
export async function listarSetores() { return request<{ ok: true, setores: Setor[] }>('/setores') }
export async function listarChamados() { return request<{ ok: true, chamados: ChamadoTransporte[] }>('/chamados') }
export async function criarChamado(payload: { pacienteCodigoOuIniciais: string; origemId: string; destinoId: string; tipoTransporte: string; prioridade: PrioridadeOperacional; risco: RiscoTransporte; solicitanteId: string; observacoes: string; checklist: ChecklistTransporte }) { return request<{ ok: true, chamado: ChamadoTransporte }>('/chamados', { method: 'POST', body: JSON.stringify(payload) }) }
