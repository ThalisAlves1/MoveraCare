# MoverCare Backend com Supabase

Este backend substitui o armazenamento em memória pelo Supabase/Postgres.

## 1. Substituir a pasta backend

Copie esta pasta `backend` para dentro do seu projeto:

```bash
/workspaces/MoveraCare/backend
```

Se preferir, apague a pasta backend antiga e coloque esta no lugar.

## 2. Criar o arquivo .env

Dentro da pasta backend, crie um arquivo chamado `.env`:

```bash
cd /workspaces/MoveraCare/backend
cp .env.example .env
```

Abra o `.env` e preencha:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
PORT=3333
```

Você pega esses dados no Supabase em:

Project Settings → API

Use a chave `anon/public` para este MVP. Não coloque chave `service_role` no Android nem no Web.

## 3. Instalar e rodar

```bash
cd /workspaces/MoveraCare/backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

A API deve responder em:

```txt
https://urban-robot-5g6p4vxj444wh7xwg-3333.app.github.dev/health
```

Retorno esperado:

```json
{
  "ok": true,
  "app": "MoverCare API",
  "version": "0.2.0",
  "database": "supabase"
}
```

## 4. Teste

1. Rode o backend.
2. Deixe a porta 3333 como Public no Codespaces.
3. Abra o Web na porta 5173.
4. Crie um chamado.
5. Abra `/chamados` na porta 3333.
6. O chamado deve aparecer salvo no Supabase.
7. Abra o app Android e clique em Atualizar.

## Importante

O Web e o app Android não precisam mudar se eles já apontam para a API da porta 3333.
