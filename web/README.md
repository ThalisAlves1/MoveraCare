# MoverCare Web Starter

Painel web inicial do MoverCare para a enfermagem/equipe assistencial criar chamados de transporte intra-hospitalar.

## Decisão de arquitetura

- Web: enfermagem/equipe assistencial cria chamado.
- Web: coordenador acompanha operação.
- Web: administrador gerencia usuários, setores, QR Codes e regras.
- Mobile Kotlin: maqueiro recebe chamado, aceita/recusa, lê QR Code da origem/destino e conclui transporte.

## O que já está pronto

- Login visual simples.
- Dashboard da enfermagem.
- Indicadores básicos.
- Lista de chamados.
- Tela de criação de chamado.
- Checklist pré-transporte.
- Validação de campos obrigatórios.
- Detalhe do chamado criado.
- Dados salvos em memória durante o uso.

## Como rodar

Abra a pasta no VS Code e rode:

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado no terminal, normalmente:

```bash
http://localhost:5173
```

## Próximo passo

Conectar esse painel web com o mesmo backend que o app mobile vai usar.
