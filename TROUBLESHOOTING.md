# Troubleshooting Guide

## Quick Start Issues

### Problem: "npm install" fails
**Symptoms:** Error messages about missing dependencies or version conflicts
**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -r node_modules
rm package-lock.json

# Fresh install
npm install

# If still failing, check Node.js version
node --version    # Should be 18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

### Problem: Database connection error
**Symptoms:** "Cannot connect to database" or "ENOENT: no such file"
**Solutions:**
```bash
# Check if database exists
ls -la parking.db

# If missing, initialize it
npx prisma migrate deploy
npx prisma db seed

# Check Prisma client is generated
ls -la node_modules/@prisma/client

# If missing:
npx prisma generate
```

### Problem: "Port 3000 already in use"
**Symptoms:** "Error: listen EADDRINUSE: address already in use :::3000"
**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000              # macOS/Linux

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev

# Or stop via task manager (Windows)
taskkill /F /IM node.exe
```

### Problem: Electron window won't open
**Symptoms:** No window appears, but Express server runs
**Solutions:**
```bash
# Check if display server available (Linux)
export DISPLAY=:0

# Run with debug output
DEBUG=electron:* npm run dev

# Check for errors in console
npm run dev 2>&1 | tee debug.log

# Verify preload.ts exists
ls src/main/preload.ts

# Rebuild native modules
npm rebuild
```

---

## Development Workflow Issues

### Problem: Changes not reflecting (Hot Reload not working)
**Symptoms:** File changes don't update in running application
**Solutions:**
```bash
# Restart dev server
# Press Ctrl+C to stop, then:
npm run dev

# Clear Vite cache
rm -r .vite

# Restart dev server
npm run dev

# Check if file is being saved
# Look for "watched file change" messages in console
```

### Problem: TypeScript errors in IDE but code runs
**Symptoms:** Red squiggly lines in VS Code but `npm run dev` works
**Solutions:**
```bash
# Regenerate TypeScript definitions
npx tsc --noEmit

# Restart VS Code

# Verify tsconfig.json paths are correct
# Check "compilerOptions.paths" in tsconfig.json

# Update VS Code TypeScript version
# CMD+Shift+P → "TypeScript: Select TypeScript Version"
```

### Problem: ESLint/Prettier conflicts
**Symptoms:** Linter errors that contradict formatting rules
**Solutions:**
```bash
# Run eslint fix
npm run lint -- --fix

# Format with prettier
npx prettier --write "src/**/*.ts{,x}"

# Check .eslintrc.cjs includes prettier
cat .eslintrc.cjs | grep prettier
```

---

## IPC & Communication Issues

### Problem: "ipcRenderer is not defined"
**Symptoms:** Error: "Cannot read property 'ipcRenderer' of undefined"
**Root Cause:** window.electron not exposed in preload.ts
**Solution:**
```typescript
// In src/main/preload.ts, verify this exists:
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => ipcRenderer.on(channel, func),
    // ... more methods
  }
});

// In React component:
const result = await window.electron.ipcRenderer.invoke('auth:login', {...});
```

### Problem: IPC handler not responding
**Symptoms:** IPC call times out or returns undefined
**Solutions:**
```typescript
// 1. Check handler is registered in src/main/index.ts
const handler = ipcMain.handle('parking:getLots', async () => {
  // implementation
});

// 2. Verify channel name matches exactly (case-sensitive)
// Frontend: 'parking:getLots'
// Main: ipcMain.handle('parking:getLots', ...)

// 3. Check for errors in main process
// If handler throws, error will be in main console

// 4. Add error handling
ipcMain.handle('parking:getLots', async (event) => {
  try {
    // implementation
    return result;
  } catch (error) {
    console.error('IPC Error:', error);
    throw error; // Send error back to frontend
  }
});

// 5. Frontend error handling
try {
  const result = await window.electron.ipcRenderer.invoke('parking:getLots');
} catch (error) {
  console.error('IPC Error:', error);
}
```

### Problem: "Channel not allowed"
**Symptoms:** Error about IPC channel validation
**Solution:**
```typescript
// The channel must be registered in preload.ts
// In src/main/preload.ts:
const ALLOWED_CHANNELS = ['auth:login', 'parking:getLots', /* ... */];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, func) => {
      if (ALLOWED_CHANNELS.includes(channel)) {
        ipcRenderer.on(channel, func);
      }
    },
  }
});
```

---

## Database Issues

### Problem: "PRAGMA integrity_check failed"
**Symptoms:** Database corrupted or locked
**Solutions:**
```bash
# Make backup first
cp parking.db parking.db.backup

# Try to repair (SQLite)
sqlite3 parking.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp parking.db.backup parking.db

# Or reset database (development only)
rm parking.db
npx prisma migrate deploy
npx prisma db seed
```

### Problem: Migrations failing
**Symptoms:** "Migration process failed" or schema mismatch
**Solutions:**
```bash
# Check migration status
npx prisma migrate status

# If stuck, reset (development only - LOSES DATA)
npx prisma migrate reset

# Or manually remove migrations
rm prisma/migrations/*
npx prisma migrate deploy  # Creates fresh migration

# Check schema matches expectation
npx prisma validate
```

### Problem: Duplicates in database
**Symptoms:** Multiple records with same ID or unexpected duplicated data
**Solutions:**
```bash
# Identify duplicates
sqlite3 parking.db "SELECT id, COUNT(*) FROM User GROUP BY id HAVING COUNT(*) > 1;"

# Resolve manually in Prisma Studio
npx prisma studio

# Or reset database
rm parking.db && npx prisma migrate deploy && npx prisma db seed
```

### Problem: Query taking too long
**Symptoms:** Database operations slow, timeouts
**Solutions:**
```bash
# Analyze query plan
sqlite3 parking.db "EXPLAIN QUERY PLAN SELECT * FROM Ticket WHERE vehicleNumber LIKE '%AB%';"

# Add index if needed
sqlite3 parking.db "CREATE INDEX idx_ticket_vehicle ON Ticket(vehicleNumber);"

# Update Prisma schema
// In schema.prisma
model Ticket {
  // ...
  vehicleNumber String
  
  @@index([vehicleNumber])  // Add this
}

npx prisma migrate dev
```

---

## React Frontend Issues

### Problem: "Cannot find module '@renderer/...'"
**Symptoms:** Module resolution error in TypeScript
**Solution:**
```typescript
// Verify tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@backend/*": ["src/backend/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"]
    }
  }
}

// Verify Vite config
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': '/src/renderer',
      '@shared': '/src/shared',
    }
  }
});

// Restart dev server after changes
```

### Problem: State not updating in React component
**Symptoms:** useState changes don't trigger re-render
**Solutions:**
```typescript
// BAD: Mutating state directly
const [user, setUser] = useState({ name: 'John' });
user.name = 'Jane';  // Doesn't work!

// GOOD: Create new object
setUser({ ...user, name: 'Jane' });

// For arrays:
// BAD:
items.push(newItem);
setItems(items);

// GOOD:
setItems([...items, newItem]);

// Or use useCallback for functions
const handleClick = useCallback(() => {
  setCount(c => c + 1);  // Always get latest value
}, []);
```

### Problem: Infinite loop in useEffect
**Symptoms:** Component re-renders continuously, console logs repeating
**Solutions:**
```typescript
// BAD: No dependency array
useEffect(() => {
  setState(someValue);  // Every render, causes setState, causes re-render
});

// GOOD: Empty dependency array (run once on mount)
useEffect(() => {
  loadData();
}, []);

// GOOD: Specific dependencies
useEffect(() => {
  loadData(userId);
}, [userId]);  // Only run when userId changes

// GOOD: Using refs for values that shouldn't trigger re-render
const countRef = useRef(0);
useEffect(() => {
  countRef.current++;
  console.log('This runs:', countRef.current);  // Won't create loop
}, []);
```

### Problem: Form not submitting
**Symptoms:** Form submit handler not called
**Solutions:**
```typescript
// BAD: onClick instead of form submit
<input type="submit" onClick={handleSubmit} />

// GOOD: Use form onSubmit
<form onSubmit={handleSubmit}>
  <input type="text" />
  <button type="submit">Submit</button>
</form>

// Handler should prevent default
const handleSubmit = (e) => {
  e.preventDefault();  // Prevent page reload
  // Handle form data
};
```

---

## Build & Distribution Issues

### Problem: Build fails with "cannot find module"
**Symptoms:** Build succeeds locally but fails in dist
**Solutions:**
```bash
# Clear build cache
rm -r dist .vite

# Rebuild explicitly
npm run build

# Check for dynamic imports
# Search for: require(), dynamic imports with variables
grep -r "require(\`" src/

# Use static imports instead
// BAD:
const module = require(`./modules/${name}`);

// GOOD:
import module from './modules/static-name';
```

### Problem: Installer file won't create
**Symptoms:** "npm run dist" fails or incomplete .exe
**Solutions:**
```bash
# Check electron-builder is installed
npm list electron-builder

# Install if missing
npm install --save-dev electron-builder

# Rebuild native modules
npm rebuild

# Try dist with verbose output
npm run dist -- --publish=never -v

# Check for code signing requirements
# Remove cert signing from package.json if not needed
```

### Problem: Application crashes on launch
**Symptoms:** Installer works but app crashes immediately
**Solutions:**
```bash
# Try without installers (portable mode)
npm run build
./dist/parking-system-portable.exe

# Check logs
%APPDATA%/Parking System/logs/

# Enable remote debugging
npm run dev  # Works?

# Check if missing files in build
ls -la dist/

# Rebuild and check size
npm run build:analyze
```

---

## Performance Issues

### Problem: Application sluggish/slow
**Symptoms:** Delays when opening pages, slow database queries
**Solutions:**
```bash
# 1. Analyze bundle size
npm run build:analyze

# 2. Check database query performance
# In Prisma Studio or with logging
npx prisma db execute --stdin
EXPLAIN QUERY PLAN SELECT * FROM Ticket;

# 3. Add indexes to frequently queried columns
# In schema.prisma:
model Ticket {
  // ...
  @@index([vehicleNumber])
  @@index([status])
  @@index([createdAt])
}

npx prisma migrate dev

# 4. Implement pagination
// Bad: Fetch all 10000 records
const tickets = await prisma.ticket.findMany();

// Good: Fetch with pagination
const tickets = await prisma.ticket.findMany({
  take: 20,
  skip: (page - 1) * 20,
});

# 5. Use caching for static data
const pricingRules = await cache.getOrSet('pricingRules', async () => {
  return await prisma.pricingRule.findMany();
}, { ttl: 3600 });
```

---

## Windows Specific Issues

### Problem: File paths with spaces fail
**Symptoms:** "Command not found" errors on Windows
**Solutions:**
```bash
# Use quotes in batch files
set "NODE_PATH=C:\Program Files\nodejs"

# Or use short path (DOS 8.3 format)
set "NODE_PATH=C:\Progra~1\nodejs"

# In package.json, escape properly
"scripts": {
  "dev": "set NODE_ENV=development && electron ."
}
```

### Problem: Windows Defender blocks application
**Symptoms:** .exe deleted or blocked by antivirus
**Solutions:**
- Sign executable with valid certificate
- Or add exception in Windows Defender

### Problem: Application data location
**Symptoms:** Database file location unclear
**Solution:**
```javascript
// Store in user AppData
const { app } = require('electron');
const appPath = app.getPath('userData');
// Result: C:\Users\<username>\AppData\Roaming\Parking System\
```

---

## Debug Commands

```bash
# Full debug mode
DEBUG=* npm run dev 2>&1 | tee debug.log

# Only Electron debug
DEBUG=electron:* npm run dev

# Only Vite debug
DEBUG=vite:* npm run dev

# Database debug
DEBUG=@prisma* npm run dev

# Save logs to file
npm run dev > output.log 2>&1
```

---

## Getting More Help

1. **Check logs:** `tail -f ./logs/*.log`
2. **Open DevTools:** Ctrl+Shift+I in running app
3. **Check GitHub Issues:** Look for similar problems
4. **Enable Debug Mode:** Set DEBUG=* before running
5. **Create minimal reproduction:** Isolate the problem in simple code

---

**Last Updated:** January 2024
