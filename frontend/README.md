# Bigthink public website

Phase 1 of the Bigthink platform: the responsive public website for Home, About, Think, Grow, Build, Connect, Insights and Contact.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS 4 (with component styling in `src/app/globals.css`)
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The service pages are generated from `src/app/[slug]/page.tsx`; the homepage is `src/app/page.tsx`. Shared navigation and footer live in `src/components/site.tsx`.

## Current scope

The homepage and Grow page load published opportunities from the API when available; local sample listings appear when the API cannot be reached. Connect loads live events with account registration. The Contact form posts inquiries to the API. Login, registration and role-based account tools use the API's JWT session (`/login`, `/register`, `/account`). Employers can post roles and review applications; suppliers can submit a profile and respond to buyer requests; buyers can publish requests; event staff can publish events.

Homepage photography currently uses Unsplash image URLs as visual stand-ins. Replace them with approved, locally stored Bigthink assets before launch. Search and opportunity/event listings currently use sample content; connect them to managed backend data before launch.
