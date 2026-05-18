# ana-frontend

Interface web do **ANA — Attorney Normative Assistent**.

> Backend: [`ana-backend`](https://github.com/Luna-v0/ana-backend) · Arquitetura: [`ana-arch`](https://github.com/Luna-v0/ana-arch)

## Stack

- **Vite 6** — bundler e dev server
- **Tailwind CSS 4** — estilos via `@tailwindcss/vite`
- **JavaScript vanilla** — sem framework de UI

## Layout

```
src/
├── api/          # cliente HTTP para ana-backend
├── components/   # componentes reutilizáveis
├── views/        # telas
├── utils/        # helpers
├── styles/       # CSS / Tailwind
└── main.js       # entrypoint
```

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
```

## Deploy

Containerizado via `Dockerfile`, servido por Nginx (`nginx.conf`). O `docker-compose.yml` em [`ana-arch`](https://github.com/Luna-v0/ana-arch) orquestra o serviço junto com backend e dependências.
