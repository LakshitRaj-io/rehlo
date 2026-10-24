# REHLO — verified student stays near SRM KTR

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Motion + Zod, with **Supabase**
(Postgres + Storage) as the backend. Deployed on Vercel.

Every flat, PG and hostel is listed by a REHLO agent, so everything on the site is verified and every
deal goes through REHLO. The public can only post **vacancies** (a spare room in a flat they live in),
which stay hidden until staff verify them.

## Setup

1. **Database.** In Supabase → SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates
   the tables, turns on row-level security (no public access) and creates the `listing-media` storage bucket.
2. **Environment.** Copy `.env.example` to `.env.local` and fill it in. Add the same variables in
   Vercel → Project → Settings → Environment Variables:

   | Variable | Where it comes from |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Same page, `service_role` / secret key. **Server only.** |
   | `ADMIN_PASSWORD_HASH` | `npm run admin:hash -- "your-password"` |
   | `ADMIN_SESSION_SECRET` | Optional. Any long random string; defaults to the service key |
   | `NEXT_PUBLIC_SITE_URL` | Optional. e.g. `https://rehlo.in` |

3. Run it:

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```

Requires Node 20.9+.

## Staff area (`/admin`)

| Who | Signs in with | Can do |
|---|---|---|
| Site admin | username `admin` + the admin password | Everything: all listings, student vacancies, assigning listings to agents, verification checks, all enquiries, service requests, agent accounts |
| Agent | username + password the admin created | Create, edit, publish and delete **their own** listings; see **every** enquiry, mark it contacted / follow-up / closed and record the student's response |

- Until `ADMIN_PASSWORD_HASH` is set, the original default password still works and the admin
  sees a warning banner. **Set it before going live.**
- Sessions are httpOnly, HMAC-signed cookies checked on the server for every action. Deactivating
  an agent signs them out immediately. Five wrong passwords from one IP in a minute lock it for 60s.
- Only the admin can tick "Landlord verified" and "Details checked".

## Routes

| Route | What it does |
|---|---|
| `/` | Home |
| `/explore` | Filterable listings (filters live in the URL) |
| `/stay/[slug]` | Listing detail with photos, **video tours**, charges, enquiry / callback |
| `/saved` | Saved stays (kept in the visitor's browser) |
| `/flatmates` | Flatmate preference matcher |
| `/services` | Home-service requests |
| `/post-a-vacancy` | Public vacancy form with photo and video upload (`/list-your-property` redirects here) |
| `/admin` | Staff area |

## How data flows

- Public pages read published listings on the server (`lib/db/queries.ts`), cached and refreshed
  whenever staff change a listing. Landlord details, verification notes and agent assignment are never
  sent to public pages.
- Every form posts to a server action (`app/actions/*`) that re-validates with the same Zod schema the
  form uses (`lib/validation.ts`) before writing with the service-role key.
- Photos (10 MB) and videos (50 MB, the Supabase Free plan cap) upload straight from the browser to
  Supabase Storage through one-off signed URLs, so large files never pass through a Vercel function.
