# DeskLine — IT Helpdesk Management System

A full-stack IT helpdesk / ticketing tool.

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (email + password)

## Features

- **Roles:** Admin, Agent, Employee — each sees a scoped view of the system
- **Tickets:** create, update, assign, filter, search; auto-generated ticket numbers (`TKT-000123`)
- **SLA tracking:** each category has a base SLA (hours); priority applies a multiplier (Urgent ×0.25, High ×0.5, Medium ×1, Low ×1.5) to compute a due date, and overdue tickets are flagged automatically
- **Comments & activity log:** threaded comments per ticket, plus agent/admin-only internal notes hidden from the requester, and a full timestamped activity trail
- **Categories/Departments:** admin-managed, each with its own base SLA
- **Dashboard:** ticket counts by status/priority, overdue count, average resolution time, recent tickets — scoped per role

## Project structure

```
it-helpdesk/
  server/     Express API + MongoDB models
  client/     React (Vite) frontend
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/it_helpdesk
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the included MongoDB database with Docker Desktop:

```bash
docker compose up -d mongodb
```

Alternatively, make sure MongoDB is running locally, or point `MONGO_URI` at a MongoDB Atlas connection string.

Seed demo data (an admin, an agent, an employee, and starter categories):

```bash
npm run seed
```

This creates:
| Role     | Email                  | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@helpdesk.com      | password123 |
| Agent    | agent@helpdesk.com      | password123 |
| Employee | employee@helpdesk.com   | password123 |

Start the API:

```bash
npm run dev      # with nodemon, auto-restarts
# or
npm start
```

The API runs at `http://localhost:5000/api`.

## 2. Frontend setup

```bash
cd client
npm install
cp .env.example .env
```

`.env` should point at your API:

```
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173`.

## 3. Using the app

1. Log in as `admin@helpdesk.com` (or register a new employee account).
2. As admin, add a few categories under **Categories** and invite agents under **Team**.
3. As an employee, raise a ticket from **New ticket**.
4. As an agent/admin, open the ticket to assign it, change status/priority, and leave comments or internal notes.
5. Check the **Dashboard** for live counts and SLA/overdue tracking.

## Notes on roles

- **Employee:** can create tickets and see/comment only on their own tickets. May edit a ticket's title/description only while it's still `Open`.
- **Agent:** sees all tickets, can change status/priority/category/assignment, and post internal notes.
- **Admin:** everything an agent can do, plus manage users, categories, and delete tickets/users.

## Production notes

This is a solid starting point, not a hardened production deployment. Before going live, consider:
- Rate limiting and stricter input validation/sanitization
- Password reset / email verification flows
- File attachments on tickets (e.g. via S3-compatible storage)
- HTTPS termination and secure cookie-based token storage instead of `localStorage`
- Pagination on the tickets list and dashboard queries for large datasets
