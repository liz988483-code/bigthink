# Bigthink backend

Node.js and TypeScript API for the Next.js website in `../frontend`. It provides JWT-backed accounts, contact inquiries, opportunity publishing and applications, event publishing and registrations, and a supplier/buyer marketplace. Use MySQL Server for storage and MySQL Workbench to create/manage the schema and inspect records.

## Run locally

1. Install MySQL Server and MySQL Workbench. In Workbench, connect to your local server and create a schema named `bigthink` (or run `CREATE DATABASE bigthink CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`). Workbench is the client; the API connects to MySQL Server.
2. In Workbench, create a dedicated application user and grant it access to the schema (replace the sample password):

   ```sql
   CREATE USER 'bigthink_app'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
   GRANT ALL PRIVILEGES ON bigthink.* TO 'bigthink_app'@'localhost';
   ```

   Copy `.env.example` to `.env`, set `DATABASE_URL` to `mysql://bigthink_app:YOUR_PASSWORD@localhost:3306/bigthink`, and generate a 32-byte JWT secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. URL-encode special characters in the database password.
   On Windows, `powershell -ExecutionPolicy Bypass -File .\scripts\configure-local.ps1` prompts for those connection values without echoing the password and writes a fresh local JWT secret to the ignored `.env` file.
3. Run `npm install`.
4. Run `npm run db:setup` to create the initial tables.
5. Run `npm run dev`; the API listens on `http://localhost:4000`.

The frontend's `NEXT_PUBLIC_API_URL` should point to this API (see `../frontend/.env.example`). Health: `GET /api/health`. Auth: `/api/auth` (`register`, `login`, `me`, `logout`). Inquiries: `POST /api/inquiries`. Opportunities and applications: `/api/opportunities`. Events and registrations: `/api/events`. Supplier profiles and buyer requests: `/api/marketplace`. Insight publishing: `/api/insights`.

Registration is limited to public account roles; administrative roles cannot be self-assigned. To bootstrap trusted staff, first register the owner's account, then grant its role through Workbench, for example `UPDATE users SET role='super_admin' WHERE email='owner@example.com';`. Sign out and back in to receive a token with the updated role. Assign `events_admin` and `verification_officer` only to trusted staff. Do not expose role assignment to public forms.

Role workflows: candidates apply to published opportunities; employers publish opportunities and review applications; buyers post procurement requests; suppliers submit profiles for verification and verified suppliers can respond to requests; event administrators publish events; content editors publish insights. The role list and schema are in `db/schema.sql`.

Email notifications, password recovery, media uploads, full content administration, supplier request notifications and deployment configuration remain to be added. Use HTTPS in production and configure real secrets and database credentials outside source control. Local DB setup/runtime still needs to be completed using the MySQL Server connection you manage in Workbench.
