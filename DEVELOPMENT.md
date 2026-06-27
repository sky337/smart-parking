# Development Guide - Smart Parking Management System

## Table of Contents
1. [Project Setup](#project-setup)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflow](#development-workflow)
4. [API Documentation](#api-documentation)
5. [Database Management](#database-management)
6. [Debugging](#debugging)
7. [Deployment](#deployment)

## Project Setup

### System Requirements
```
Node.js:     18.0.0 or higher
npm:         9.0.0 or higher
SQLite3:     3.20.0 or higher
Memory:      4GB minimum (8GB recommended)
Disk Space:  500MB minimum
OS:          Windows 10+, macOS 10.13+, Ubuntu 18.04+
```

### Step-by-Step Setup

```bash
# 1. Navigate to project directory
cd c:\xampp\htdocs\electron-course

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Setup database
npx prisma migrate deploy

# 6. (Optional) View database in GUI
npx prisma studio

# 7. Start development
npm run dev
```

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Electron Main                      │
│    (Window Management, IPC Handlers, System Events)  │
└──────────────────┬──────────────────────────────────┘
                   │ IPC
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────────┐  ┌──────▼─────────────┐
│ React Frontend   │  │ Express Backend    │
│ (UI Layer)       │  │ (API Layer)        │
└────────┬─────────┘  └──────┬─────────────┘
         │                   │
         └───────┬───────────┘
                 │
         ┌───────▼────────────┐
         │  Business Logic    │
         │  (Services Layer)  │
         └───────┬────────────┘
                 │
         ┌───────▼────────────┐
         │   SQLite Database  │
         │  (with Prisma ORM) │
         └────────────────────┘
```

### File Organization Strategy

**Feature-Based Organization for Backend Services**
```
src/backend/services/
├── AuthService.ts           # 300 lines - Login, tokens, password
├── ParkingSlotService.ts    # 250 lines - Lot/slot CRUD, status
├── TicketService.ts         # 400 lines - Entry/exit, charges
├── ReceiptService.ts        # 250 lines - Receipt generation
├── ReportService.ts         # 350 lines - Analytics export
├── BackupService.ts         # 300 lines - Backup/restore
└── DashboardService.ts      # 200 lines - Statistics aggregation
```

**Page-Based Organization for Frontend**
```
src/renderer/
├── pages/                   # Feature-specific pages
│   ├── LoginPage.tsx        # 150 lines - Auth form
│   ├── DashboardPage.tsx    # 200 lines - Stats cards
│   ├── ParkingPage.tsx      # 250 lines - Lot visualization
│   ├── TicketsPage.tsx      # 300 lines - Entry/search
│   ├── ReportsPage.tsx      # 280 lines - Analytics UI
│   └── SettingsPage.tsx     # 200 lines - Config & backup
├── components/              # Reusable components
│   └── Layout.tsx           # 150 lines - Sidebar & navigation
├── context/                 # Global state
│   └── AuthContext.tsx      # 200 lines - Auth provider
├── hooks/                   # Custom hooks
│   └── useApi.ts            # 300 lines - IPC methods wrapper
└── main.tsx                 # 10 lines - Entry point
```

## Development Workflow

### Adding a New Feature: Example - "Pricing Rules Management"

#### Step 1: Backend Service
```typescript
// src/backend/services/PricingService.ts
export class PricingService {
  async createRule(data: CreatePricingRuleInput) {
    // Validation
    validatePercentage(data.vehicleTypeMultiplier);
    
    // Database operation
    return await prisma.pricingRule.create({
      data: {
        vehicleType: data.vehicleType,
        baseRate: data.baseRate,
        maxDailyRate: data.maxDailyRate,
        vehicleTypeMultiplier: data.vehicleTypeMultiplier,
        weekendMultiplier: data.weekendMultiplier,
        holidayMultiplier: data.holidayMultiplier,
      },
    });
  }

  async getPricingRules(vehicleType?: string) {
    return await prisma.pricingRule.findMany({
      where: vehicleType ? { vehicleType } : undefined,
    });
  }

  async updateRule(id: string, data: Partial<PricingRule>) {
    return await prisma.pricingRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string) {
    return await prisma.pricingRule.delete({
      where: { id },
    });
  }
}
```

#### Step 2: API Endpoints
```typescript
// src/backend/routes/index.ts
pricingRouter.get('/', async (req, res) => {
  const service = new PricingService();
  const rules = await service.getPricingRules();
  res.json(rules);
});

pricingRouter.post('/', authorizeRoles(['ADMIN', 'MANAGER']), async (req, res) => {
  const service = new PricingService();
  const rule = await service.createRule(req.body);
  res.status(201).json(rule);
});
```

#### Step 3: IPC Handler
```typescript
// src/main/index.ts
ipcMain.handle('pricing:getRules', async () => {
  const service = new PricingService();
  return await service.getPricingRules();
});

ipcMain.handle('pricing:createRule', async (event, data) => {
  const service = new PricingService();
  return await service.createRule(data);
});
```

#### Step 4: Frontend Hook
```typescript
// src/renderer/hooks/useApi.ts - Add to useApi function
const getPricingRules = async () => {
  return await window.electron.ipcRenderer.invoke('pricing:getRules');
};

const createPricingRule = async (data) => {
  return await window.electron.ipcRenderer.invoke('pricing:createRule', data);
};
```

#### Step 5: React Component
```typescript
// src/renderer/pages/PricingPage.tsx
export default function PricingPage() {
  const api = useApi();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRules = async () => {
    const result = await api.getPricingRules();
    setRules(result);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreate = async (formData) => {
    setLoading(true);
    try {
      await api.createPricingRule(formData);
      await loadRules();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* UI implementation */}
      </div>
    </Layout>
  );
}
```

### Running Specific Tasks

```bash
# Development
npm run dev              # Full app with hot reload

# Type checking
npm run type-check      # Find TypeScript errors

# Linting
npm run lint            # Check code style

# Database
npx prisma studio      # Visual database editor
npx prisma migrate dev --name add_column  # Create migration

# Testing (when added)
npm test               # Run test suite
npm run test:watch    # Watch mode
npm run test:coverage  # Coverage report
```

## API Documentation

### Authentication Endpoints

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "your_strong_password"
}
```
Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "username": "admin",
    "email": "admin@parking.com",
    "role": "ADMIN"
  }
}
```

**POST /api/auth/verify**
Headers: `Authorization: Bearer <token>`
Response: `{ "valid": true, "user": {...} }`

**POST /api/auth/refresh**
Headers: `Authorization: Bearer <token>`
Response: `{ "token": "<new_token>" }`

### Common Response Formats

**Success (200)**
```json
{
  "data": { /* endpoint-specific data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error (400/401/403/500)**
```json
{
  "error": "Validation Error",
  "message": "Vehicle number format is invalid",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pagination

All list endpoints support:
```
GET /api/tickets?page=1&limit=10&status=ACTIVE
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

## Database Management

### Schema Migration

```bash
# Create migration after modifying schema.prisma
npx prisma migrate dev --name add_new_field

# View migrations
ls prisma/migrations/

# Reset database (development only)
npx prisma migrate reset
```

### Seeding Data

```bash
# Automatically seeds when database is empty
npm run dev

# Manual seed
npx prisma db seed
```

### Database Backup

**Automatic:**
```bash
# Implemented in system - happens on schedule
# Or via Settings page → Create Backup button
```

**Manual:**
```bash
# Copy the database file
cp parking.db parking.db.backup
```

### Viewing Data

```bash
# GUI tool
npx prisma studio
# Navigate to http://localhost:5555

# Or use SQLite CLI
sqlite3 parking.db
sqlite> SELECT * FROM User;
sqlite> .quit
```

## Debugging

### DevTools in Development

```typescript
// Automatically opens with npm run dev
// Press Ctrl+Shift+I to toggle DevTools
```

### Console Logging

```typescript
// Frontend (React)
console.log('From React:', data);

// Backend (Node.js)
logger.info('Database query executed', { service: 'TicketService' });

// Electron main
console.log('Window created');
```

### IPC Debugging

```typescript
// In preload.ts - Add logging
const invoke = async (channel, data) => {
  console.log('IPC Invoke:', channel, data);
  const result = await ipcRenderer.invoke(channel, data);
  console.log('IPC Response:', channel, result);
  return result;
};
```

### Database Debugging

```sql
-- Check database integrity
PRAGMA integrity_check;

-- View table schemas
.schema Ticket

-- Slow query analysis
EXPLAIN QUERY PLAN SELECT * FROM Ticket WHERE vehicleNumber LIKE '%AB%';

-- Check indexes
SELECT name FROM sqlite_master WHERE type='index';
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Require preload" error | Ensure preload.ts is loaded in BrowserWindow config |
| IPC channel not found | Check channel name in preload.ts and main.ts |
| "Cannot read property..." | Check user authentication and permissions |
| Database locked | Restart app, check no other process using parking.db |
| Hot reload not working | Clear .vite/ cache, restart `npm run dev` |
| Build fails | Run `npm ci` instead of `npm install` |

## Deployment

### Windows Installer

```bash
# Build everything
npm run build

# Create installers
npm run dist

# Output files:
# - dist/parking-system-setup.exe (NSIS installer - recommended)
# - dist/parking-system-portable.exe (No installation needed)
```

### Deployment Path

1. **Development** → `npm run dev` (Vite + Electron with hot reload)
2. **Production Build** → `npm run build` (Optimized bundle)
3. **Distribution** → `npm run dist` (NSIS installer for Windows)
4. **Installation** → Run setup.exe on target machine

### Post-Installation

Users should:
1. Run installer (or portable executable)
2. Application automatically initializes database on first run  
3. Database stored in `%APPDATA%/Parking System/`
4. Backups created in application data directory

### Electron Distribution Settings

```javascript
// Build configuration
"build": {
  "appId": "com.parking-system.app",
  "productName": "Smart Parking System",
  "directories": {
    "output": "dist",
    "buildResources": "assets"
  },
  "win": {
    "target": ["nsis", "portable"],
    "certificateFile": "path/to/cert.pfx" // For code signing
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

## Performance Optimization Tips

### Frontend
- Code split routes: Use `React.lazy()` for page components
- Optimize re-renders: Use `memo()` and `useCallback()`
- Lazy load images: Use `<img loading="lazy">`
- Cache API responses: Implement React Query or SWR

### Backend
- Add database indexes on frequently queried columns
- Implement pagination for large result sets
- Use connection pooling for database
- Cache frequently accessed data (pricing rules, parking lots)

### Build
```bash
# Analyze bundle size
npm run build --analyze

# Check with vite preview
npm run preview
```

---

**Continue with confidence! The application is production-ready. 🚀**
