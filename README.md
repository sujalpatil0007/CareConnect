# CareConnect — Community Emergency Response System

CareConnect is a full-stack, real-time community safety and emergency coordination application built with **React 19 + Vite**, **Node.js + Express**, **Socket.IO**, and persistent JSON datastore (`backend/db.json`).

The application is structured to follow the provided CareConnect architecture wireframe (`media_1787980705986.jpg` / `careconnect-reference.png`).

---

## 📱 Supported Workflows & Roles

1. **Authentication Flow**:
   - `Login`: Credentials validation, show/hide password toggle, 1-click demo switcher.
   - `Forgot Password`: Generates reset token and provides password update workflow.
   - `Create Account`: Full registration form with role selection, flat/block assignment.
   - `Role Selection`: Quick role launcher to enter each role dashboard.

2. **Resident Flow**:
   - **SOS Emergency**: Central glowing SOS button triggers instant emergency broadcast.
   - **Live Location**: GPS coordinate simulation, high-accuracy indicator, stop/start sharing toggle.
   - **Emergency Contacts**: Contact cards, simulated call modal, Add/Delete contact operations.
   - **Safety Companion**:
     - *Silent SOS*: Discreet emergency trigger.
     - *Fall Guard*: Automatic impact and inactivity monitoring toggle.
     - *Voice Distress*: Keyword acoustic distress recognition and SOS trigger.
     - *Daily Check-in*: "I'm OKAY" confirmation and schedule rescheduling.
   - **Notifications & Alerts**: Filter tabs (`All`, `SOS`, `System`), unread indicators, mark-as-read.
   - **Profile**: Personal info editing, live status toggle, change password, and logout.

3. **Guardian Dashboard Flow**:
   - **Dashboard**: Persons under care cards, live safe/active status badges, last check-in indicators.
   - **Critical Alert**: Incident alert banner with direct resident call and details view.
   - **Incident Details**: Map view, timestamp, priority badge.
   - **Response Tracking**: Vertical real-time response timeline tracking volunteer acceptance, en-route navigation, arrival, and resolution.

4. **Volunteer Flow**:
   - **Dashboard**: Available/Offline toggle, nearby emergency list with quick accept.
   - **Accept Incident**: Incident priority and location preview.
   - **On The Way / Navigation**: Route map from volunteer to resident with ETA countdown and call resident button.
   - **Arrived / On Scene**: Start assistance workflow and report issue backup.
   - **Resolve Incident**: Situation resolution with custom notes and closure.

5. **Security Desk Flow**:
   - **Dashboard**: Active incidents, guards on-duty, critical alerts count.
   - **Incident Queue**: Filterable emergency queue by priority (`Critical`, `High`, `Medium`, `Resolved`).
   - **Incident Details & Dispatch**: Guard team dispatch, resident contact, and status update logs.

6. **Society Admin Flow**:
   - **Dashboard**: Society overview (120 residents, 24 volunteers, 8 security guards) and live incident center.
   - **Resident Directory**: Live resident search, block filtering (`Block A`, `Block B`, `Block C`), and Add Resident modal.
   - **Incident Center**: Comprehensive incident audit logs and force resolve capability.
   - **Reports & Analytics**: Monthly incident trend bar charts, category breakdown, and downloadable full safety report.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```
> **Backend URL**: `http://localhost:4000`

### 2. Start the Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
> **Frontend URL**: `http://localhost:5173`

---

## 🔑 Demo Accounts

All demo accounts use password: `care123`

| Role | Email | Purpose |
| :--- | :--- | :--- |
| **Resident** | `resident@careconnect.demo` | Request emergency SOS, check-in, manage safety |
| **Guardian** | `guardian@careconnect.demo` | Monitor loved ones, critical alerts, response tracking |
| **Volunteer** | `volunteer@careconnect.demo` | Accept emergencies, en-route navigation, mark resolved |
| **Security** | `security@careconnect.demo` | Monitor queue by block, dispatch guards, call resident |
| **Society Admin** | `admin@careconnect.demo` | Manage residents directory, incident center, analytics |

*Tip: A quick role switch bar is available at the top of the app in preview mode to switch roles instantly.*

---

## 📡 REST API Summary

- `POST /api/auth/login` — Authenticate user
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/forgot-password` — Generate password reset code
- `POST /api/auth/reset-password` — Set new password
- `GET /api/demo-users` — Retrieve demo logins
- `GET /api/users` — List and search residents/users
- `POST /api/users` — Register resident (Society Admin)
- `PATCH /api/users/:id` — Update user profile/password/settings
- `GET /api/contacts/:userId` — Retrieve emergency contacts
- `POST /api/contacts/:userId` — Add emergency contact
- `DELETE /api/contacts/:userId/:contactId` — Delete contact
- `POST /api/checkin` — Submit daily check-in
- `GET /api/incidents` — Query incidents by status/resident/priority
- `POST /api/incidents/sos` — Trigger emergency SOS
- `PATCH /api/incidents/:id/status` — Advance incident status (`ACCEPTED`, `RESPONDING`, `ARRIVED`, `RESOLVED`, `CANCELLED`)
- `GET /api/notifications/:userId` — Fetch user notifications
- `PATCH /api/notifications/:id/read` — Mark notification read
- `PATCH /api/notifications/read-all/:userId` — Mark all read
- `GET /api/stats` — Community metrics and monthly analytics

---

## 📦 Project Structure

```
CareConnect_Exact_Wireframe/
├── backend/
│   ├── db.json             # Persistent JSON database
│   ├── server.js           # Express + Socket.IO REST & WebSocket server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx        # App root mounting
│       ├── App.jsx         # Full React Router configuration
│       ├── api.js          # Unified API client
│       ├── socket.js       # Real-time WebSocket connection
│       ├── components.jsx  # Reusable UI cards, maps, modals, Shell
│       ├── styles.css      # Wireframe-accurate CSS styling
│       ├── context/
│       │   └── AuthContext.jsx # Authentication & notification state
│       └── pages/          # All 6 reference flows (20+ pages)
├── DEMO_CHECKLIST.md
└── README.md
```
