# MeuwooMoney

A shared expense tracker built for couples (and a housemate). Track spending, set budgets, split bills, settle up with Lydia, and get AI-powered financial advice — all wrapped in a cat-themed UI.

## Features

- **Shared & Personal Expenses** — Log transactions as Shared (50/50), Felix-only, Sophie-only, SharedAll (3-way with Lydia), or Lydia-paid
- **Transaction Management** — Add, edit, and delete transactions with date picker and category selection
- **Budget Tracking** — Per-category budget limits with real-time status
- **Lydia Settlement** — Automatic 3-way split calculation with half-month settlement periods (1st–15th and 16th–end)
- **Payment Confirmation** — Monthly payment status tracking for Felix and Sophie
- **Deposits** — Track extra deposits and Lydia transfer payments per month
- **Monthly Reports** — In-app PDF export with charts and category breakdowns
- **AI Advice** — Gemini-powered financial tips based on your spending
- **Email Notifications** — Automated settlement reminders, payment reminders, and monthly report PDFs via Vercel Cron
- **Annual Savings Goal** — $10k target with year-to-date progress tracking
- **Guest Demo Mode** — Try the app with mock data without signing in

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | NeonDB (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | better-auth (Google OAuth) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Email | Resend |
| AI | Google Gemini API |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [NeonDB](https://neon.tech) database
- [Google OAuth credentials](https://console.cloud.google.com/apis/credentials) (Web application type)
- API keys for [Gemini](https://ai.google.dev), [Resend](https://resend.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/meuwoomoney.git
cd meuwoomoney

# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.example .env.local

# Push database schema
npm run db:push

# (Optional) Seed sample data
npm run db:seed

# Start dev server
npm run dev
```

### Environment Variables

See [`.env.example`](.env.example) for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | NeonDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL (`http://localhost:3000` for dev) |
| `ALLOWED_EMAILS` | Comma-separated approved user emails |
| `GEMINI_API_KEY` | Google Gemini API key |
| `RESEND_API_KEY` | Resend API key for emails |
| `NOTIFICATION_EMAILS` | Comma-separated emails for cron job notifications |
| `CRON_SECRET` | Secret to authenticate Vercel Cron requests |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/          # better-auth API handler
│   │   ├── advice/                 # Gemini AI advice endpoint
│   │   └── cron/
│   │       ├── settlement-reminder/  # Daily end-of-month settlement emails
│   │       ├── monthly-report/       # Monthly PDF report emails
│   │       └── payment-reminder/     # Daily payment reminder emails
│   ├── auth/[path]/                # Sign-in page (Google OAuth)
│   ├── demo/                       # Guest demo mode (no auth)
│   ├── error.tsx                   # Error boundary
│   ├── page.tsx                    # Server component (fetches transactions)
│   └── layout.tsx
├── components/
│   ├── Dashboard.tsx               # Main client component
│   ├── GoogleSignInButton.tsx      # Google OAuth sign-in button
│   ├── UserMenu.tsx                # User avatar + sign-out menu
│   ├── TransactionForm.tsx         # Add new expenses
│   ├── TransactionList.tsx         # Transaction history
│   ├── TransactionItem.tsx         # Single transaction row
│   ├── StatsCards.tsx              # Budget overview cards
│   ├── ChartsSection.tsx           # Spending charts
│   ├── ReportModal.tsx             # In-app PDF report
│   ├── SavingsBanner.tsx           # Annual savings progress
│   ├── SettlementCard.tsx          # Lydia settlement summary
│   ├── PaymentStatusCard.tsx       # Monthly payment confirmation
│   ├── DepositsCard.tsx            # Extra deposits & Lydia transfers
│   └── CatIcon.tsx                 # Cat paw icon component
└── lib/
    ├── auth/
    │   ├── server.ts               # better-auth server config
    │   └── client.ts               # better-auth client config
    ├── schema.ts                   # Drizzle schema (transactions + auth tables)
    ├── auth-check.ts               # Session helpers (getUserInfo, isApprovedUser)
    ├── stats.ts                    # Stats computation logic
    ├── actions.ts                  # Server actions (add/delete/update transactions)
    ├── payment-actions.ts          # Server actions (payment confirmations)
    ├── deposit-actions.ts          # Server actions (deposits & Lydia transfers)
    ├── queries.ts                  # Database query helpers
    ├── constants.ts                # Budget limits, user profiles
    ├── types.ts                    # TypeScript type definitions
    ├── melbourne-time.ts           # Melbourne timezone date utilities
    ├── mock-data.ts                # Demo mode mock transactions
    ├── generate-monthly-pdf.ts     # Server-side PDF generation
    ├── email-template.ts           # Email HTML templates
    ├── monthly-report-email.ts     # Monthly report email sender
    └── payment-reminder-email.ts   # Payment reminder email sender
```

## Cron Jobs

Configured in [`vercel.json`](vercel.json):

| Job | Schedule | Description |
|-----|----------|-------------|
| Settlement Reminder | Daily 18:00 UTC | Sends settlement email in the last 3 days of each month |
| Monthly Report | 1st of month 18:00 UTC | Sends previous month's PDF report via email |
| Payment Reminder | Daily 18:00 UTC | Sends payment reminder emails when confirmations are pending |

## License

MIT
