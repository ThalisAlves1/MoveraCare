-- MoverCare Supabase schema
-- Você já rodou este SQL, mas ele fica aqui como referência.

create table if not exists usuarios (
  id text primary key,
  nome text not null,
  login text unique not null,
  perfil text not null,
  setor_vinculado text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists setores (
  id text primary key,
  nome text not null,
  ordem_rota int not null default 0,
  qr_code_id text unique not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists chamados (
  id text primary key,
  numero text unique not null,
  paciente_codigo_ou_iniciais text not null,
  origem_id text not null references setores(id),
  destino_id text not null references setores(id),
  tipo_transporte text not null,
  prioridade text not null,
  risco text not null,
  status text not null,
  solicitante_id text not null references usuarios(id),
  solicitante_nome text not null,
  maqueiro_responsavel_id text references usuarios(id),
  maqueiro_responsavel_nome text,
  observacoes text default '',
  checklist jsonb not null default '{}'::jsonb,
  tentativas_qr_invalidas jsonb not null default '[]'::jsonb,
  horario_aceite timestamptz,
  horario_qr_origem timestamptz,
  horario_qr_destino timestamptz,
  horario_conclusao timestamptz,
  motivo_cancelamento text,
  motivo_recusa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists historico_status (
  id bigserial primary key,
  chamado_id text not null references chamados(id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  usuario_id text references usuarios(id),
  usuario_nome text,
  observacao text,
  criado_em timestamptz not null default now()
);
