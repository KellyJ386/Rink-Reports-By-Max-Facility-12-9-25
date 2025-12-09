# Max Facility Operations (MFO)

## Ice Rink Management SaaS Platform

A comprehensive, production-ready ice rink management SaaS platform designed to replace paper logs, ensure regulatory compliance, and provide actionable analytics for ice rink facilities across North America.

## Features

### Eight Core Modules

1. **Ice Depth Monitoring** - Interactive SVG rink diagrams (25/35/47-point configurations), Bluetooth caliper integration, Gemini AI analysis, SPC charts
2. **Ice Operations** - Ice Make Logbook, Zamboni/Olympia Circle Checks, Blade Change Reports
3. **Incident Reporting** - Interactive body diagram for injury marking, severity levels, ambulance flag with SMS notifications
4. **Refrigeration Room Logs** - Daily plant readings, equipment metrics, compliance documentation
5. **Air Quality Monitoring** - CO₂ level readings, temperature/humidity, configurable threshold alerts
6. **Employee Scheduling** - Calendar-based scheduling, shift templates, time-off request workflow
7. **Facility Checklists / SOPs** - Standard open/close procedures, toggle switch completion
8. **Admin Panel** - User/Facility management, RBAC, Drag-and-Drop Form Builder

### Key Features

- **Drag-and-Drop Form Builder** - Create custom forms with 18+ field types, conditional logic, and digital signatures
- **Role-Based Access Control** - 6 user roles with granular permissions
- **Mobile-First PWA** - Offline-capable Progressive Web App
- **Multi-Tenant Architecture** - Support for multiple organizations and facilities
- **Real-Time Alerts** - Configurable threshold alerts for safety monitoring

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ (App Router), React, TypeScript, TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth.js |
| File Storage | Google Cloud Storage |
| AI/Analytics | Gemini AI (Vertex AI) |
| External APIs | OpenWeather API, SendGrid/Resend, Twilio |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Platform account (optional, for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/rink-reports-by-max-facility.git
cd rink-reports-by-max-facility
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth.js
- `NEXTAUTH_URL` - Your application URL

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application dashboard
│   └── admin/             # Admin panel pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── form-builder/     # Drag-and-drop form builder
│   ├── form-renderer/    # Form rendering engine
│   ├── ice-depth/        # Ice depth monitoring
│   └── incidents/        # Incident reporting
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
├── types/                 # TypeScript types
└── prisma/               # Database schema
```

## User Roles

| Role | Access Level |
|------|--------------|
| Super Admin | Platform-wide access |
| Facility Admin | Full facility access, Form Builder |
| Manager | Department-level access, reporting |
| Supervisor | Shift-level access, time-off approvals |
| Ice Technician | Ice operations, refrigeration logs |
| Staff | Basic access, form submission |

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## License

Copyright © 2024 Max Facility Operations. All rights reserved.
