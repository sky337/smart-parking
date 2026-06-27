# Smart Parking Management System - API Reference

## Base URL
```
Development:   http://localhost:3000/api
Production:    https://parking-system.example.com/api
```

## Authentication

All endpoints except `/auth/login` require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 24 hours. Use `/auth/refresh` to get a new token before expiration.

---

## Auth Endpoints

### POST /auth/login
**Description:** User login with credentials
**Access:** Public
**Request Body:**
```json
{
  "username": "admin",
  "password": "your_strong_password"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@parking.com",
      "role": "ADMIN",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```
**Error (401):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /auth/verify
**Description:** Verify if token is valid and user is still active
**Access:** Authenticated users
**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user_123",
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

### POST /auth/refresh
**Description:** Get a new token using current token
**Access:** Authenticated users
**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "<new_jwt_token>"
  }
}
```

---

## Parking Management Endpoints

### GET /parking/lots
**Description:** List all parking lots
**Access:** All authenticated roles
**Query Parameters:**
```
?search=Central    # Search by lot name
&skip=0            # Pagination skip
&take=10           # Pagination limit
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "lot_123",
      "name": "Central Garage",
      "location": "Downtown",
      "totalSlots": 150,
      "availableSlots": 45,
      "occupancyRate": 70,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "skip": 0,
    "take": 10
  }
}
```

### POST /parking/lots
**Description:** Create new parking lot
**Access:** ADMIN, MANAGER
**Request Body:**
```json
{
  "name": "North Tower",
  "location": "Building A",
  "totalSlots": 100
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "lot_456",
    "name": "North Tower",
    "location": "Building A",
    "totalSlots": 100
  }
}
```

### GET /parking/slots/:lotId
**Description:** Get slots for a parking lot
**Access:** All authenticated roles
**Query Parameters:**
```
?status=AVAILABLE     # Filter by status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)
?zone=A               # Filter by zone
?skip=0
?take=50
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "slot_001",
      "slotNumber": "A-01",
      "lotId": "lot_123",
      "zone": "A",
      "floor": 1,
      "coordinates": { "x": 10, "y": 5 },
      "status": "AVAILABLE",
      "vehicleType": "CAR",
      "lastUpdated": "2024-01-15T10:00:00Z"
    },
    {
      "id": "slot_002",
      "slotNumber": "A-02",
      "status": "OCCUPIED",
      "currentTicket": "TKT20240115001"
    }
  ]
}
```

### GET /parking/availability
**Description:** Get occupancy statistics
**Access:** All authenticated roles
**Query Parameters:**
```
?lotId=lot_123    # Optional - specific lot
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSlots": 150,
    "availableSlots": 45,
    "occupiedSlots": 100,
    "reservedSlots": 5,
    "maintenanceSlots": 0,
    "occupancyRate": 70,
    "byZone": {
      "A": { "total": 50, "available": 15, "rate": 70 },
      "B": { "total": 50, "available": 15, "rate": 70 },
      "C": { "total": 50, "available": 15, "rate": 70 }
    }
  }
}
```

### PUT /parking/slots/:slotId/status
**Description:** Update slot status
**Access:** ADMIN, MANAGER
**Request Body:**
```json
{
  "status": "MAINTENANCE",
  "reason": "Repair needed"
}
```

---

## Ticket Management Endpoints

### POST /tickets/entry
**Description:** Create entry ticket
**Access:** ADMIN, MANAGER, OPERATOR
**Request Body:**
```json
{
  "vehicleNumber": "DL01AB1234",
  "slotId": "slot_001",
  "vehicleType": "CAR",
  "vehicleColor": "Silver",
  "operatorId": "user_123"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "ticketNumber": "TKT202401151001",
    "vehicleNumber": "DL01AB1234",
    "slotNumber": "A-01",
    "entryTime": "2024-01-15T10:30:00Z",
    "status": "ACTIVE"
  }
}
```

### POST /tickets/:id/exit
**Description:** Process exit and calculate charges
**Access:** ADMIN, MANAGER, OPERATOR
**Request Body:**
```json
{
  "operatorId": "user_123",
  "paymentMethod": "CASH"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_123",
      "ticketNumber": "TKT202401151001",
      "entryTime": "2024-01-15T10:30:00Z",
      "exitTime": "2024-01-15T14:45:00Z",
      "duration": 255,
      "status": "COMPLETED"
    },
    "charge": {
      "id": "charge_123",
      "baseCharge": 200,
      "overtimeCharge": 50,
      "tax": 12.50,
      "discount": 0,
      "totalAmount": 262.50,
      "status": "PAID",
      "paymentMethod": "CASH"
    },
    "receipt": {
      "receiptNumber": "RCP202401151001",
      "thermally_formatted": true
    }
  }
}
```

### GET /tickets/:id
**Description:** Get ticket details
**Access:** All authenticated roles
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "ticketNumber": "TKT202401151001",
    "vehicleNumber": "DL01AB1234",
    "slotNumber": "A-01",
    "entryTime": "2024-01-15T10:30:00Z",
    "exitTime": "2024-01-15T14:45:00Z",
    "status": "COMPLETED",
    "createdBy": "user_123"
  }
}
```

### GET /tickets/number/:number
**Description:** Search ticket by number
**Access:** All authenticated roles
**Response (200):** Same format as GET /tickets/:id

### GET /tickets
**Description:** Advanced ticket search
**Access:** All authenticated roles
**Query Parameters:**
```
?vehicleNumber=AB      # Substring search
?slotId=slot_001       # Exact match
?status=COMPLETED      # (ACTIVE, COMPLETED, CANCELLED)
?fromDate=2024-01-01   # Date range
?toDate=2024-01-15
?page=1
?limit=20
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    { /* ticket objects */ }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

## Receipt Endpoints

### POST /receipts/:ticketId/generate
**Description:** Generate receipt for a ticket
**Access:** ADMIN, MANAGER, ACCOUNTANT
**Request Body:**
```json
{
  "format": "THERMAL"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "RCP202401151001",
    "ticketNumber": "TKT202401151001",
    "amount": 262.50,
    "format": "THERMAL",
    "content": "═══════════════════════════════════════════\n  SMART PARKING MANAGEMENT SYSTEM\n═══════════════════════════════════════════\nReceipt #: RCP202401151001\nTicket #: TKT202401151001\n..."
  }
}
```

### POST /receipts/:id/print
**Description:** Mark receipt as printed
**Access:** All authenticated roles
**Response (200):**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "RCP202401151001",
    "printCount": 1,
    "lastPrintedAt": "2024-01-15T14:50:00Z"
  }
}
```

### GET /receipts/:ticketId
**Description:** Get receipt for a ticket
**Access:** All authenticated roles

---

## Report Endpoints

### POST /reports/daily-summary
**Description:** Generate daily parking summary
**Access:** All authenticated roles
**Request Body:**
```json
{
  "date": "2024-01-15"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportType": "DAILY_SUMMARY",
    "date": "2024-01-15",
    "totalTickets": 156,
    "completedTickets": 150,
    "totalRevenue": 41250.50,
    "averageCharge": 275,
    "peakHour": "12:00-13:00",
    "paymentBreakdown": {
      "CASH": { "count": 85, "total": 23450 },
      "CARD": { "count": 65, "total": 17800.50 }
    }
  }
}
```

### POST /reports/revenue
**Description:** Generate revenue report
**Access:** ADMIN, MANAGER, ACCOUNTANT
**Request Body:**
```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-01-15"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportType": "REVENUE_REPORT",
    "period": "2024-01-01 to 2024-01-15",
    "totalRevenue": 625750.50,
    "dailyBreakdown": [
      {
        "date": "2024-01-15",
        "revenue": 41250.50,
        "ticketCount": 150
      }
    ],
    "paymentMethodBreakdown": {
      "CASH": 312500.50,
      "CARD": 313250
    }
  }
}
```

### POST /reports/occupancy
**Description:** Generate occupancy analysis
**Access:** All authenticated roles
**Request Body:**
```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-01-15"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportType": "OCCUPANCY_REPORT",
    "period": "2024-01-01 to 2024-01-15",
    "averageOccupancyRate": 72,
    "byZone": {
      "A": { "total": 50, "avgOccupancy": 75, "peakTime": "12:00-13:00" },
      "B": { "total": 50, "avgOccupancy": 70, "peakTime": "12:00-13:00" },
      "C": { "total": 50, "avgOccupancy": 70, "peakTime": "12:00-13:00" }
    },
    "hourlyBreakdown": [
      { "hour": "09:00", "occupancy": 45 },
      { "hour": "12:00", "occupancy": 85 },
      { "hour": "18:00", "occupancy": 60 }
    ]
  }
}
```

### POST /reports/export
**Description:** Export report to PDF or Excel
**Access:** All authenticated roles
**Request Body:**
```json
{
  "reportType": "DAILY_SUMMARY",
  "format": "PDF",
  "date": "2024-01-15"
}
```
**Response (200):**
```
File download started (PDF or Excel file)
```

---

## Backup Endpoints

### POST /backups
**Description:** Create database backup
**Access:** ADMIN, MANAGER
**Response (201):**
```json
{
  "success": true,
  "data": {
    "backupId": "backup_123",
    "backupName": "parking_backup_20240115_103000",
    "createdAt": "2024-01-15T10:30:00Z",
    "backupSize": 5242880,
    "status": "COMPLETED"
  }
}
```

### GET /backups
**Description:** List all backups
**Access:** ADMIN, MANAGER
**Query Parameters:**
```
?limit=20
?offset=0
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "backupId": "backup_123",
      "backupName": "parking_backup_20240115_103000",
      "createdAt": "2024-01-15T10:30:00Z",
      "backupSize": 5242880,
      "status": "VERIFIED"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

### POST /backups/:id/restore
**Description:** Restore from backup
**Access:** ADMIN
**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Backup restored successfully",
    "restoredAt": "2024-01-15T10:45:00Z",
    "backupName": "parking_backup_20240115_103000"
  }
}
```

### DELETE /backups/:id
**Description:** Delete a backup
**Access:** ADMIN
**Response (204):** No content

---

## Dashboard Endpoints

### GET /dashboard/stats
**Description:** Get real-time parking statistics
**Access:** All authenticated roles
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSlots": 150,
    "occupiedSlots": 105,
    "availableSlots": 45,
    "reservedSlots": 0,
    "occupancyRate": 70,
    "todayRevenue": 41250.50,
    "activeTickets": 105,
    "averageCharge": 275,
    "averageStayDuration": 180,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### GET /dashboard/hourly-stats
**Description:** Get hourly statistics for today
**Access:** All authenticated roles
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "hour": 9, "tickets": 12, "revenue": 3300 },
    { "hour": 10, "tickets": 25, "revenue": 6875 },
    { "hour": 12, "tickets": 45, "revenue": 12375 }
  ]
}
```

### GET /dashboard/zone-stats/:lotId
**Description:** Get zone-wise occupancy
**Access:** All authenticated roles
**Response (200):**
```json
{
  "success": true,
  "data": {
    "lot": "Central Garage",
    "zones": [
      { "zone": "A", "total": 50, "occupied": 35, "available": 15, "rate": 70 },
      { "zone": "B", "total": 50, "occupied": 37, "available": 13, "rate": 74 },
      { "zone": "C", "total": 50, "occupied": 33, "available": 17, "rate": 66 }
    ]
  }
}
```

### GET /health
**Description:** Check system health
**Access:** Public
**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "database": "connected",
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| INVALID_CREDENTIALS | 401 | Username/password incorrect |
| TOKEN_EXPIRED | 401 | JWT token has expired |
| UNAUTHORIZED | 403 | User lacks required role/permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Input validation failed |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SLOT_NOT_AVAILABLE | 400 | Slot already occupied/reserved |
| TICKET_NOT_FOUND | 404 | Ticket doesn't exist |
| INSUFFICIENT_PERMISSIONS | 403 | User role cannot perform action |

---

## Rate Limiting

- General endpoints: 100 requests per minute
- Auth endpoints: 10 requests per minute per IP
- Report/Export endpoints: 20 requests per minute

---

**Last Updated:** January 2024
