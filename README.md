<<<<<<< HEAD
# Smart Parking Management System

A production-ready, full-stack Smart Parking Management System built with **Electron**, **React**, **TypeScript**, **Express**, **Prisma**, and **SQLite**.

## 📋 Features

### Core Functionality
- 🔐 **Role-Based Authentication** - Admin, Manager, Operator, Accountant roles
- 🅿️ **Parking Management** - Multiple parking lots, zones, and slots with real-time status
- 🎫 **Ticket Management** - Automatic ticket number generation, entry/exit tracking
- 💰 **Dynamic Charging** - Intelligent charge calculation based on parking duration and pricing rules
- 🧾 **Receipt Generation** - Thermal printer support with print tracking
- 📊 **Business Reports** - Daily summaries, revenue reports, occupancy analytics (PDF/Excel export)
- 💾 **Backup & Restore** - Automatic database backups with integrity verification
- 📈 **Real-Time Dashboard** - Live statistics and occupancy visualization
- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support via Electron

### Technical Highlights
- **TypeScript** - Full type safety across frontend and backend
- **Context Isolation** - Secure IPC communication between electron processes
- **Clean Architecture** - Feature-based folder structure with separation of concerns
- **Comprehensive Logging** - File-based logging with timestamps and color output
- **Input Validation** - Validation at both API and UI layers
- **Error Handling** - Custom error classes with proper HTTP status codes
- **Role-Based Authorization** - Permission matrix for each user role

## 🏗️ Project Structure

```
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts        # Window creation, IPC handlers
│   │   └── preload.ts      # Secure context-isolated API
│   ├── backend/            # Express server & services
│   │   ├── services/       # Business logic (Auth, Parking, Ticket, etc.)
│   │   ├── routes/         # 30+ API endpoints
│   │   ├── middleware/     # CORS, auth, error handling, logging
│   │   └── utils/          # Database initialization
│   ├── renderer/           # React frontend
│   │   ├── pages/          # Login, Dashboard, Parking, Tickets, Reports, Settings
│   │   ├── components/     # Layout, reusable components
│   │   ├── context/        # Auth context provider
│   │   ├── hooks/          # useApi, useAsync custom hooks
│   │   └── main.tsx        # React entry point
│   └── shared/             # Shared types, constants, utilities
│       ├── types/          # TypeScript interfaces & enums
│       ├── constants/      # App-wide constants (100+)
│       └── utils/          # Logger, validators, helpers, errors
├── prisma/
│   └── schema.prisma       # Database schema (14 models)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── .env.example            # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- SQLite3 (included in most systems)

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Setup environment**
```bash
cp .env.example .env
```

3. **Generate database**
```bash
npx prisma generate
npx prisma migrate deploy
```

4. **Start development**
```bash
npm run dev
```

The application will:
- Start Express backend on `http://localhost:3000`
- Initialize SQLite database at `./parking.db`
- Open Electron window (1920x1080)
- Auto-seed default admin user, parking lot, and pricing rules

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start Electron app in dev mode with hot reload

# Build & Production
npm run build            # Build for production (Vite renderer + esbuild main)
npm run dist             # Create distributable (including Windows installer)
npm run preview          # Preview production build

# Database
npx prisma studio      # Open Prisma Studio (visual database manager)
npx prisma db push     # Sync schema to database
npx prisma db seed     # Run seed function

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript types
```

## 🔑 Default Credentials

After first run, log in with:
- **Username**: `admin`
- **Password**: `your_strong_password`

## 📊 Database Schema

**14 Models** with comprehensive relationships:
- **User** - Users with role-based permissions
- **ParkingLot** - Multi-lot support
- **ParkingSlot** - Individual slots with floor/zone/status
- **Facility** - Amenities like elevators, restrooms, EV charging
- **PricingRule** - Dynamic rates per vehicle type
- **Ticket** - Entry/exit records with auto-generated numbers
- **Charge** - Payment calculations with tax/discount breakdown
- **Receipt** - Thermal printer formatted receipts
- **Report** - Generated analytics reports
- **DatabaseBackup** - Backup history with integrity checks
- **AuditLog** - All user actions tracked
- **SystemLog** - Application events and errors
- **DashboardWidget** - Widget configurations per user

## 🔒 Security Features

- **JWT Authentication** - 24-hour token expiration with refresh capability
- **Password Hashing** - bcryptjs with 10-round salt
- **Role-Based Authorization** - Fine-grained permission control
- **Context Isolation** - Secure IPC with channel validation
- **Input Validation** - 10+ validators for all input types
- **Error Handling** - No sensitive data in error messages
- **Audit Logging** - All critical actions logged with user/timestamp

## 📱 User Roles & Permissions

| Action | Admin | Manager | Operator | Accountant |
|--------|-------|---------|----------|-----------|
| Create Ticket | ✅ | ✅ | ✅ | ❌ |
| Exit Ticket | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Rates | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| Database Backup | ✅ | ✅ | ❌ | ❌ |

## 🖥️ API Endpoints (30+)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify token validity
- `POST /api/auth/refresh` - Get new token

### Parking Management
- `GET /api/parking/lots` - List parking lots
- `POST /api/parking/lots` - Create lot (Admin/Manager)
- `GET /api/parking/slots/:lotId` - Get slots with filters
- `GET /api/parking/availability` - Occupancy statistics

### Ticket Management
- `POST /api/tickets/entry` - Create entry ticket
- `POST /api/tickets/:id/exit` - Process exit with charges
- `GET /api/tickets/:id` - Get ticket details
- `GET /api/tickets/number/:number` - Search by ticket number
- `GET /api/tickets` - Advanced search with filters

### Receipts & Reports
- `POST /api/receipts/:id/print` - Mark receipt as printed
- `POST /api/reports/daily-summary` - Generate daily report
- `POST /api/reports/revenue` - Revenue breakdown
- `POST /api/reports/export` - Export to PDF/Excel

### System
- `POST /api/backups` - Create backup
- `GET /api/backups` - List backups
- `POST /api/backups/:id/restore` - Restore from backup
- `GET /api/dashboard/stats` - Real-time statistics

## 🔧 IPC Channels (20+)

Frontend communicates with Electron main process via these channels:
- `auth:login` - Authenticate user
- `parking:getLots` - Fetch parking lots
- `parking:getSlots` - Fetch slots
- `ticket:create` - Create entry ticket
- `ticket:exit` - Process exit with charge
- `receipt:generate` - Generate receipt
- `report:generate` - Generate report
- `report:export` - Export to PDF/Excel
- `backup:create` - Trigger backup
- `backup:restore` - Restore backup
- `system:health` - Get system status

## 📊 Sample Data

After initialization, the system includes:
- **1 Admin User** - Full system access
- **1 Parking Lot** - "Central Garage"
- **30 Parking Slots** - Across 3 zones (A, B, C) with 10 slots each
- **3 Pricing Rules** - Standard (₹50/hr), Compact (₹40/hr), Premium (₹60/hr)

## 🐛 Debugging & Logs

- **Application Logs** - `./logs/` directory (daily rotation)
- **Database** - `./parking.db` (SQLite file)
- **Backups** - `./backups/` (timestamped backup files)
- **Reports** - `./reports/` (PDF/XLSX exports)

Enable DevTools in dev mode: Right-click → Inspect

## 📦 Building for Distribution

### Windows

```bash
npm run build
npm run dist
```

Creates:
- **parking-system-setup.exe** - NSIS installer
- **parking-system-portable.exe** - Portable version

Installers are created in `./dist/` directory.

## 🚢 Deployment

### Windows System
1. Run installer on target machine
2. Application creates `%APPDATA%/Parking System/` for data
3. SQLite database persists locally
4. Backups stored in application data directory

### Linux/macOS
```bash
npm run dist
# Creates DMG (macOS) or AppImage (Linux)
```

## 📝 Environment Variables

```env
DATABASE_URL=file:./parking.db
NODE_ENV=production
ELECTRON_IS_DEV=false
LOG_LEVEL=info
PORT=3000
JWT_SECRET=your_32_char_secret_key_12345678
BACKUP_RETENTION_DAYS=30
MAX_DAILY_RATE=500
TAX_PERCENTAGE=5
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain 80%+ test coverage
3. Use feature branches (`feature/parking-enhancement`)
4. Write meaningful commit messages
5. Update documentation

## 📄 License

Proprietary - Smart Parking Management System

## 📞 Support

For issues and feature requests, contact the development team.

---

**Built with ❤️ using Electron, React, TypeScript, and Express**
=======
# smart-parking
Smart Parking Management System built with Electron, React, Node.js, Express, SQLite, and Prisma for Windows desktop applications.
>>>>>>> origin/main
