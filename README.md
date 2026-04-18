# ABC Airlines — Next.js Web App

Full-stack airline reservation system built with Next.js 14 (App Router) + PostgreSQL.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your database
Copy the example env file and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:
```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=abc_airlines
PG_USER=postgres
PG_PASSWORD=your_actual_password_here
```

### 3. Make sure your database is ready
Run the SQL script from earlier (`abc_airlines_with_data.sql`) in pgAdmin or psql:
```bash
psql -U postgres -d abc_airlines -f abc_airlines_with_data.sql
```

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
abc_airlines_nextjs/
├── app/
│   ├── page.js                    # Home — role selection
│   ├── layout.js                  # Root layout with nav
│   ├── globals.css
│   │
│   ├── employee/
│   │   ├── page.js                # Employee dashboard
│   │   ├── airports/page.js       # CRUD airports
│   │   ├── flights/page.js        # CRUD flights
│   │   ├── planes/page.js         # CRUD planes
│   │   ├── employees/page.js      # CRUD employees
│   │   ├── passengers/page.js     # View all passengers
│   │   ├── bookings/page.js       # View all bookings
│   │   └── schedule/page.js       # 7-day schedule
│   │
│   ├── passenger/
│   │   └── page.js                # Login/Register + browse/book/cancel
│   │
│   └── api/
│       ├── airports/route.js      # GET all, POST
│       ├── airports/[id]/route.js # PUT, DELETE
│       ├── flights/route.js       # GET all, POST
│       ├── flights/[id]/route.js  # GET one, PUT, DELETE
│       ├── planes/route.js        # GET all, POST
│       ├── planes/[id]/route.js   # PUT, DELETE
│       ├── employees/route.js     # GET all, POST
│       ├── employees/[id]/route.js# PUT, DELETE
│       ├── passengers/route.js    # GET all, POST
│       ├── passengers/[id]/route.js # GET one, PUT, DELETE
│       ├── bookings/route.js      # GET all, POST, DELETE
│       ├── schedule/route.js      # GET 7-day schedule
│       └── works-on/route.js      # POST, DELETE crew assignments
│
├── components/
│   └── ui.js                      # Shared components (Card, Table, Modal, Btn, Input, Toast)
│
├── lib/
│   └── db.js                      # PostgreSQL pool (singleton)
│
├── .env.local.example             # <- copy to .env.local and fill password
└── package.json
```

---

## Features

### Employee Panel (`/employee`)
| Page | What you can do |
|------|----------------|
| Airports | Add / Edit / Delete airports with multivalued contacts |
| Flights | Add / Edit / Delete flights, view full details with crew and dates |
| Planes | Full fleet CRUD |
| Employees | Add / Edit / Delete staff with designations and contacts |
| Passengers | View all registered passengers |
| Bookings | View all reservations across all flights |
| Schedule | Full 7-day advance flight schedule |

### Passenger Portal (`/passenger`)
- Login with existing Passenger ID
- Register as a new passenger
- Browse all available flights
- View full flight details (crew, scheduled dates)
- Book a flight (duplicate booking prevented)
- Cancel a booking
- Edit own profile

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/airports | All airports with contacts |
| POST | /api/airports | Add airport |
| PUT | /api/airports/:id | Update airport |
| DELETE | /api/airports/:id | Delete airport |
| GET | /api/flights | All flights with stats |
| POST | /api/flights | Add flight |
| GET | /api/flights/:id | Flight detail + dates + crew |
| PUT | /api/flights/:id | Update flight |
| DELETE | /api/flights/:id | Delete flight + cascade |
| GET | /api/planes | All planes |
| POST | /api/planes | Add plane |
| PUT | /api/planes/:id | Update plane |
| DELETE | /api/planes/:id | Delete plane |
| GET | /api/employees | All employees |
| POST | /api/employees | Add employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete + cascade |
| GET | /api/passengers | All passengers |
| POST | /api/passengers | Register passenger |
| GET | /api/passengers/:id | Profile + bookings |
| PUT | /api/passengers/:id | Update profile |
| DELETE | /api/passengers/:id | Delete + cascade |
| GET | /api/bookings | All bookings |
| POST | /api/bookings | Book a flight |
| DELETE | /api/bookings | Cancel booking |
| GET | /api/schedule | 7-day schedule |
| POST | /api/works-on | Assign employee to flight |
| DELETE | /api/works-on | Remove assignment |
