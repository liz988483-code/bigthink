# Bigthink

Bigthink is organized as a monorepo with separate frontend and backend projects.

- [`frontend/`](./frontend/) — Next.js public website (Home, About, Think, Grow, Build, Connect, Insights and Contact).
- [`backend/`](./backend/) — Express/TypeScript API with MySQL inquiry storage and JWT account endpoints.

## Start the website

Open a terminal in `frontend/`, run `npm install` if needed, then `npm run dev`. The website runs at `http://localhost:3000`.

## Start the API

Set up MySQL Server, MySQL Workbench and environment variables using [`backend/README.md`](./backend/README.md), then run `npm run dev` in `backend/`. The frontend reads the API address from `frontend/.env.local` as `NEXT_PUBLIC_API_URL` (copy the example file to get started).

The public site has eight main sections. Connected workflows now include contact inquiries, account registration/login, employer opportunity posts and applications, event publishing/registration, supplier profile verification, buyer requests and insight publishing. Dashboard tools are role-based. The remaining work includes local MySQL configuration and end-to-end checks, email and password recovery, file uploads, broader content/admin controls and deployment.
