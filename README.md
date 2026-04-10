# 🗓️ SmartBook — Smart Booking System

A full-stack booking platform connecting customers with service providers, built with React, Node.js, MySQL, Socket.io, and a Python AI chatbot.

---

## 📐 Architecture Overview

```
smart-booking-complete/
├── backend/               # Node.js + Express REST API
│   ├── config/            # MySQL & Cloudinary config
│   ├── controllers/       # Auth, Bookings, Services, Admin, Notifications
│   ├── middleware/        # JWT auth, Multer upload
│   ├── routes/            # All API routes
│   ├── sockets/           # Socket.io real-time handler
│   ├── schema.sql         # MySQL database schema
│   ├── app.js             # Express app
│   └── server.js          # HTTP server + Socket.io init
│
├── frontend/              # React 18 SPA
│   └── src/
│       ├── components/    # Sidebar, ServiceCard, BookingModal, Chatbot, Notifications
│       ├── context/       # AuthContext (JWT + Socket.io state)
│       ├── pages/         # Login, Signup, CustomerDashboard, ProviderDashboard, AdminDashboard
│       ├── routes/        # AppRoutes, ProtectedRoute (role-based)
│       └── services/      # Axios API instance
│
└── chatbot/               # Python FastAPI chatbot
    ├── app.py             # FastAPI server
    ├── chatbot_logic.py   # Rule-based + Gemini AI responses
    └── requirements.txt
```

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Axios    |
| Backend    | Node.js, Express 4, Socket.io       |
| Database   | MySQL 8 (promise-based pool)        |
| Auth       | JWT (jsonwebtoken) + bcryptjs       |
| Images     | Cloudinary (provider service photos)|
| Real-time  | Socket.io (notifications)           |
| Chatbot    | Python FastAPI + Gemini Ai   |
| Styling    | Custom CSS (dark luxury theme)      |

---

## ⚙️ Prerequisites

- Node.js 18+
- MySQL 8+
- Python 3.9+
- A free [Cloudinary](https://cloudinary.com) account

---

## 🛠️ Setup Instructions

### 1. Database Setup

```bash
# Login to MySQL and create the database
mysql -u root -p < backend/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_booking
JWT_SECRET=your_super_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

```bash
# Start backend (development)
npm run dev

# Or production
npm start
```

Backend runs at: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

Frontend runs at: **http://localhost:3000**

---

### 4. Chatbot Setup

```bash
cd chatbot

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set Google API key for AI-powered responses
set GOOGLE_API_KEY=AIzaSyXXXX

# Start chatbot server
uvicorn app:app --reload --port 8000
```

Chatbot runs at: **http://localhost:8000**

> **Without GEMINNI_API_KEY:** The chatbot uses a rich rule-based fallback system — no AI key required to run the app.

---

## 👤 User Roles

### Customer
- Browse and search services by category
- Book services (select date, time, notes)
- View booking status (pending → accepted/rejected → completed)
- Cancel pending bookings
- Leave reviews (1–5 stars) on completed bookings
- Real-time notifications when booking status changes

### Provider
- Add services with name, description, price, duration, category, and photo
- Edit and delete their own services
- View incoming booking requests in a table
- Accept, reject, or mark bookings as completed
- Real-time notifications for new booking requests
- Revenue dashboard

### Admin
- Analytics dashboard: total users, bookings, revenue, pending count
- Bar charts: bookings per day (last 7 days), bookings by status
- Top services by booking count and revenue
- User management: view all users, activate/deactivate accounts
- View all services and all bookings platform-wide

---

## 🔌 API Endpoints

### Auth
| Method | Route              | Auth    | Description         |
|--------|--------------------|---------|---------------------|
| POST   | /api/auth/signup   | Public  | Register new user   |
| POST   | /api/auth/login    | Public  | Login, returns JWT  |
| GET    | /api/auth/me       | JWT     | Get current user    |

### Services
| Method | Route              | Auth          | Description              |
|--------|--------------------|---------------|--------------------------|
| GET    | /api/services      | Public        | Get all services (filter)|
| GET    | /api/services/:id  | Public        | Get single service       |
| POST   | /api/services      | Provider JWT  | Add service + image      |
| PUT    | /api/services/:id  | Provider JWT  | Update own service       |
| DELETE | /api/services/:id  | Provider JWT  | Soft-delete service      |

### Bookings
| Method | Route                       | Auth          | Description              |
|--------|-----------------------------|---------------|--------------------------|
| POST   | /api/bookings               | Customer JWT  | Create booking           |
| GET    | /api/bookings               | JWT           | Get own bookings         |
| PATCH  | /api/bookings/:id/status    | JWT           | Update booking status    |
| POST   | /api/bookings/:id/review    | Customer JWT  | Submit review            |

### Admin
| Method | Route                       | Auth       | Description             |
|--------|-----------------------------|------------|-------------------------|
| GET    | /api/admin/analytics        | Admin JWT  | Full analytics data     |
| GET    | /api/admin/users            | Admin JWT  | All users               |
| PATCH  | /api/admin/users/:id/toggle | Admin JWT  | Toggle user active      |
| GET    | /api/admin/bookings         | Admin JWT  | All bookings            |
| GET    | /api/admin/services         | Admin JWT  | All services            |

### Notifications
| Method | Route                          | Auth  | Description          |
|--------|--------------------------------|-------|----------------------|
| GET    | /api/notifications             | JWT   | Get notifications    |
| PATCH  | /api/notifications/read-all    | JWT   | Mark all read        |
| PATCH  | /api/notifications/:id/read    | JWT   | Mark one read        |

---

## 🔔 Real-Time Events (Socket.io)

| Event            | Direction         | Payload                            |
|------------------|-------------------|------------------------------------|
| `notification`   | Server → Client   | `{ type, title, message, bookingId }` |
| `booking_updated`| Server → Client   | `{ bookingId, status }`            |

Clients join a personal room `user_<id>` on connect. All notifications are targeted to that room.

---

## 🤖 Chatbot

The chatbot lives at `http://localhost:8000/chat` (POST).



**Without key:** Falls back to a rich rule-based system covering:
- Booking help, cancellations, status explanations
- Pricing questions, review guidance
- Provider onboarding, admin overview
- Platform feature explanations

---

## 🗂️ Database Schema

### Tables
- **users** — id, name, email, password (hashed), role, phone, is_active
- **services** — id, provider_id, name, description, price, category, image (Cloudinary URL), duration_minutes, is_active
- **bookings** — id, customer_id, service_id, provider_id, booking_date, booking_time, status, notes, total_price
- **notifications** — id, user_id, type, title, message, is_read, booking_id
- **reviews** — id, booking_id, customer_id, service_id, rating (1–5), comment

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 salt rounds)
- All protected routes require a valid JWT (`Authorization: Bearer <token>`)
- Role-based access enforced in middleware (`authorizeRoles`)
- Uploaded images filtered by MIME type (jpeg/png/webp only, max 5MB)
- MySQL queries use parameterized statements (no SQL injection risk)
- CORS restricted to `FRONTEND_URL`

---

## 📦 Running All Services

Open 3 terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start

# Terminal 3 — Chatbot
cd chatbot && uvicorn app:app --reload --port 8000
```

Then open **http://localhost:3000** in your browser.
