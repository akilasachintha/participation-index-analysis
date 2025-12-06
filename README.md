# Participation Index App

A Next.js application for tracking and analyzing participation indices across different project categories.

## Features

- ✅ Project management with category-based checklists
- 📊 Participation index calculation and tracking
- 📸 Image upload support
- 📄 PDF export functionality
- 📱 Fully responsive design
- 🔒 Secure data storage with Supabase

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd participation-index-app
```

2. Install dependencies

```bash
pnpm install
```

3. Environment variables are already configured in `.env`

4. Set up database

- Go to your Supabase SQL Editor
- Run the scripts in order:
    - `scripts/001_create_tables.sql`
    - `scripts/002_fix_categories_policies.sql`

5. Run the development server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel or Netlify.

**Quick Deploy to Vercel:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── project/           # Project routes
│   └── projects/          # Projects list
├── components/            # React components
│   └── ui/               # UI components (shadcn)
├── lib/                   # Utilities and types
│   └── supabase/         # Supabase client configs
├── scripts/               # Database SQL scripts
└── public/                # Static assets
```

## License

MIT
