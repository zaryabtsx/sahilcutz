# API Integration Guide

## Quick Reference

### Authentication Endpoints

#### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "customer" | "barber"
}

Response:
{
  "success": true,
  "user": { ... },
  "session": { ... }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "user": { ... },
  "session": { ... }
}
```

#### Get Session
```bash
GET /api/auth/session

Response:
{
  "session": { ... } | null
}
```

#### Logout
```bash
POST /api/auth/logout

Response:
{
  "success": true
}
```

### Appointments Endpoints

#### Get Appointments
```bash
GET /api/appointments?barberId=xxx&userId=xxx&date=2024-01-01&status=confirmed

Query Parameters:
- barberId (optional): Filter by barber
- userId (optional): Filter by user
- date (optional): Filter by date (YYYY-MM-DD)
- status (optional): Filter by status

Response:
[
  {
    "id": "...",
    "user_id": "...",
    "barber_id": "...",
    "service_id": "...",
    "start_at": "2024-01-01T10:00:00Z",
    "end_at": "2024-01-01T10:30:00Z",
    "duration_minutes": 30,
    "status": "confirmed",
    "is_emergency": false,
    ...
  }
]
```

#### Create Appointment
```bash
POST /api/appointments
Content-Type: application/json

{
  "user_id": "...",
  "barber_id": "...",
  "service_id": "...",
  "start_at": "2024-01-01T10:00:00Z",
  "end_at": "2024-01-01T10:30:00Z",
  "duration_minutes": 30,
  "notes": "Optional notes",
  "is_emergency": false
}

Response:
{
  "id": "...",
  "success": true,
  "shiftedAppointments": [] // If emergency booking
}
```

#### Update Appointment
```bash
PATCH /api/appointments
Content-Type: application/json

{
  "id": "...",
  "status": "confirmed" | "completed" | "cancelled",
  "notes": "Updated notes"
}

Response:
{
  "id": "...",
  "updated_at": "2024-01-01T12:00:00Z",
  ...
}
```

### Services Endpoints

#### Get Services
```bash
GET /api/services?active=true

Query Parameters:
- active (optional): Filter by active status

Response:
[
  {
    "id": "...",
    "name": "Classic Haircut",
    "description": "...",
    "price": 45,
    "duration_minutes": 30,
    "category": "Hair",
    "image_url": "...",
    "is_active": true,
    "buffer_minutes": 5,
    ...
  }
]
```

#### Create Service
```bash
POST /api/services
Content-Type: application/json

{
  "name": "Service Name",
  "description": "Description",
  "price": 45,
  "duration_minutes": 30,
  "category": "Hair",
  "image_url": "https://...",
  "is_active": true,
  "buffer_minutes": 5
}

Response:
{
  "id": "...",
  "success": true,
  ...
}
```

### Barbers Endpoints

#### Get Barbers
```bash
GET /api/barbers?slug=sahil

Query Parameters:
- slug (optional): Get specific barber by slug

Response:
[
  {
    "id": "...",
    "name": "Sahil",
    "slug": "sahil",
    "image_url": "...",
    "experience_years": 10,
    "bio": "...",
    "working_hours": {
      "start": "09:00",
      "end": "18:00",
      "breaks": [{ "start": "13:00", "end": "14:00" }],
      "off_days": ["Sunday"]
    },
    "is_available": true,
    ...
  }
]
```

#### Create Barber
```bash
POST /api/barbers
Content-Type: application/json

{
  "name": "Barber Name",
  "slug": "unique-slug",
  "image_url": "https://...",
  "experience_years": 5,
  "bio": "Bio text",
  "working_hours": {
    "start": "09:00",
    "end": "18:00",
    "breaks": [{ "start": "13:00", "end": "14:00" }],
    "off_days": ["Sunday"]
  },
  "is_available": true
}

Response:
{
  "id": "...",
  "success": true,
  ...
}
```

#### Update Barber
```bash
PATCH /api/barbers
Content-Type: application/json

{
  "id": "...",
  "is_available": true | false,
  "working_hours": { ... }
}

Response:
{
  "id": "...",
  "updated_at": "2024-01-01T12:00:00Z",
  ...
}
```

### Slots Endpoints

#### Get Available Slots
```bash
GET /api/slots?barberId=xxx&date=2024-01-01&serviceDuration=30

Query Parameters:
- barberId (required): Barber ID
- date (required if type=slots): Date in YYYY-MM-DD format
- serviceDuration (optional): Service duration in minutes (default: 30)
- type (optional): 'slots' or 'dates' (default: 'slots')

Response (type=slots):
{
  "slots": [
    {
      "start": "09:00",
      "end": "09:30",
      "available": true
    },
    ...
  ]
}

Response (type=dates):
{
  "availableDates": [
    "2024-01-02",
    "2024-01-03",
    ...
  ]
}
```

## Usage Examples

### JavaScript/TypeScript

#### Fetch Appointments
```typescript
async function getAppointments(barberId: string, date: string) {
  const response = await fetch(
    `/api/appointments?barberId=${barberId}&date=${date}`
  );
  return response.json();
}
```

#### Create Appointment
```typescript
async function createAppointment(appointmentData: any) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData),
  });
  return response.json();
}
```

#### Get Available Slots
```typescript
async function getAvailableSlots(
  barberId: string,
  date: string,
  duration: number
) {
  const response = await fetch(
    `/api/slots?barberId=${barberId}&date=${date}&serviceDuration=${duration}`
  );
  return response.json();
}
```

### cURL Examples

#### Get Services
```bash
curl -X GET "http://localhost:3000/api/services?active=true" \
  -H "Content-Type: application/json"
```

#### Create Appointment
```bash
curl -X POST "http://localhost:3000/api/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "...",
    "barber_id": "...",
    "service_id": "...",
    "start_at": "2024-01-01T10:00:00Z",
    "end_at": "2024-01-01T10:30:00Z",
    "duration_minutes": 30
  }'
```

#### Get Available Slots
```bash
curl -X GET "http://localhost:3000/api/slots?barberId=xxx&date=2024-01-01&serviceDuration=30" \
  -H "Content-Type: application/json"
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (auth required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Server Error

Error Response Format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Rate Limiting

- Free tier: 1000 requests/hour
- All endpoints are rate limited per user/IP

## Authentication

Include JWT token in Authorization header:
```bash
Authorization: Bearer <token>
```

## Testing the APIs

### Using Postman
1. Import the collection from `/postman_collection.json` (create this file)
2. Set environment variables
3. Run requests

### Using Thunder Client
Import the workspace and test endpoints

### Using the Frontend
All APIs are automatically called by frontend components with proper error handling
