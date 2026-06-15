# MoverCare Web corrigido para Codespaces

Esta pasta Web já vem corrigida com:

- Vite no package.json
- React e tipos do React
- tsconfig corrigido
- services/api.ts apontando para a API na porta 3333
- type Usuario incluído em src/domain/types.ts

## Como usar

Substitua a sua pasta `web` por esta pasta, ou copie estes arquivos para a sua pasta `web`.

Depois rode:

```bash
cd /workspaces/MoveraCare/web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Importante

- Porta 5173 = painel Web
- Porta 3333 = API/backend
- A porta 3333 precisa estar como Public no Codespaces
- O backend precisa estar rodando em outro terminal:

```bash
cd /workspaces/MoveraCare/backend
npm install
npm run dev
```

Teste a API abrindo:

https://urban-robot-5g6p4vxj444wh7xwg-3333.app.github.dev/health
