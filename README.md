# MeuwooMoney

A shared expense tracker built for couples (and a housemate). Track spending, set budgets, split bills, settle up with Lydia, and get AI-powered financial advice — all wrapped in a cat-themed UI.

## Features

- **Shared & Personal Expenses** — Log transactions as Shared (50/50), Felix-only, Sophie-only, SharedAll (3-way with Lydia), or Lydia-paid
- **Budget Tracking** — Per-category budget limits with real-time status
- **Lydia Settlement** — Automatic 3-way split calculation and net balance
- **Monthly Reports** — In-app PDF export with charts and category breakdowns
- **AI Advice** — Gemini-powered financial tips based on your spending
- **Email Notifications** — Automated settlement reminders (end-of-month) and monthly report PDFs via Vercel Cron
- **Annual Savings Goal** — $10k target with year-to-date progress tracking

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Database | NeonDB (serverless PostgreSQL) |
| ORM | Drizzle ORM |
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
| `GEMINI_API_KEY` | Google Gemini API key |
| `RESEND_API_KEY` | Resend API key for emails |
| `CRON_SECRET` | Secret to authenticate Vercel Cron requests |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── advice/          # Gemini AI advice endpoint
│   │   └── cron/
│   │       ├── settlement-reminder/  # Daily end-of-month settlement emails
│   │       └── monthly-report/       # Monthly PDF report emails
│   ├── page.tsx             # Server component (fetches transactions)
│   └── layout.tsx
├── components/
│   ├── Dashboard.tsx        # Main client component
│   ├── TransactionForm.tsx  # Add new expenses
│   ├── TransactionList.tsx  # Transaction history
│   ├── StatsCards.tsx       # Budget overview cards
│   ├── ChartsSection.tsx    # Spending charts
│   ├── ReportModal.tsx      # In-app PDF report
│   ├── SavingsBanner.tsx    # Annual savings progress
│   └── SettlementCard.tsx   # Lydia settlement summary
└── lib/
    ├── schema.ts            # Drizzle database schema
    ├── stats.ts             # Stats computation logic
    ├── actions.ts           # Server actions (add/delete)
    ├── constants.ts         # Budget limits, user profiles
    └── generate-monthly-pdf.ts  # Server-side PDF generation
```

## Cron Jobs

Configured in [`vercel.json`](vercel.json):

| Job | Schedule | Description |
|-----|----------|-------------|
| Settlement Reminder | Daily 18:00 UTC | Sends settlement email in the last 3 days of each month |
| Monthly Report | 1st of month 18:00 UTC | Sends previous month's PDF report via email |

## License

MIT
