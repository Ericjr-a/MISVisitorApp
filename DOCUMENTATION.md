# VRA MIS Visitor App Documentation

## 1. Project Overview
The **VRA MIS Visitor App** is a robust solution designed to streamline visitor management and staff interactions within the organization. It replaces manual logbooks with a digital system that enhances security, efficiency, and data accuracy.

### Key Features
- **Kiosk Mode**: Self-service check-in and check-out for visitors.
- **Admin Dashboard**: Real-time analytics and reporting for administrators.
- **Host Management**: Staff directory and host availability tracking.
- **Call Logging**: Record calls made to hosts upon visitor arrival.
- **Secure Authentication**: Role-based access control (Admin, Receptionist, Supervisor).

---

## 2. Tech Stack

### Mobile Application (`mobile/`)
Built with **React Native** and **Expo**, ensuring cross-platform compatibility (Android, iOS, Web).
- **Framework**: React Native (Expo SDK 50+)
- **Navigation**: React Navigation v6 (Stack, Bottom Tabs, Drawer)
- **State Management**: React Context API & Hooks
- **UI Components**: 
    - `react-native-reanimated` for smooth animations.
    - `react-native-svg` for vector graphics.
    - `react-native-chart-kit` for dashboard charts.
- **Data Handling**: `fetch` API for backend communication.
- **Storage**: `expo-secure-store` for persisting authentication tokens.

### Backend Server (`backend/`)
A RESTful API built with **Node.js** and **Express**.
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2` driver)
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` for password hashing.
- **Email**: `nodemailer` for notifications (e.g., password resets).
- **Environment Management**: `dotenv` for configuration.

### Frontend (`frontend/`)
Static web assets (HTML/CSS/JS), likely serving as a landing page or a separate web-based admin panel interface.

---

## 3. UI/UX Design
The application's user interface is designed in Figma, focusing on a modern, clean, and intuitive user experience.

- **Figma Project**: [Visitors Web App](https://www.figma.com/design/h77yJQHrTwnXJlZCraDRMD/visitors-web-app?node-id=0-1&p=f&t=9zJwtm9x4MR86IcH-0)
- **Design System**:
    - **Colors**: Uses a primary blue accent, distinct success/error states, and a neutral background palette.
    - **Typography**: Consistent font hierarchy for headings and body text.
    - **Components**: Reusable cards, buttons, and input fields defined in the design system.

---

## 4. Folder Structure

### Root Directory
| Directory | Description |
| :--- | :--- |
| `mobile/` | React Native mobile application source code. |
| `backend/` | Node.js/Express backend server code. |
| `frontend/` | Static HTML/CSS/JS files. |
| `database/` | SQL scripts for database schema creation. |

### Mobile App (`mobile/src/`)
| Directory | Description |
| :--- | :--- |
| `screens/` | Application screens (e.g., `LoginScreen`, `DashboardScreen`, `KioskCheckInScreen`). |
| `components/` | Reusable UI components (e.g., `CustomButton`, `Header`, `Card`). |
| `context/` | React Context providers (e.g., `AuthContext`, `SettingsContext`). |
| `services/` | API service functions (`api.js`) handling all network requests. |
| `assets/` | Images, fonts, and other static resources. |

### Backend (`backend/src/`)
| Directory | Description |
| :--- | :--- |
| `config/` | Database connection (`db.js`) and other configurations. |
| `controllers/` | Logic for handling API requests (e.g., `userController.js`, `visitorController.js`). |
| `middleware/` | Express middleware (e.g., `authMiddleware.js` for JWT verification). |
| `routes/` | API route definitions (e.g., `userRoutes.js`, `visitorRoutes.js`). |
| `server.js` | Entry point for the application. |

---

## 5. Database Schema
The application uses a MySQL database named `VisiLog`.

### Core Tables
- **`users`**: Application users with roles (`admin`, `receptionist`, `supervisor`). Stores hashed passwords and JWT tokens.
- **`guest`**: Visitor profiles containing personal details (Name, Phone).
- **`staff`**: Company employees (Hosts) with Department and Contact info.
- **`visitor_log`**: The core transaction table linking `guest` and `staff`. Tracks `check_in_time`, `check_out_time`, `purpose`, and `badge_number`.
- **`call_logs`**: Records calls made to hosts, tracking duration and purpose.
- **`phonebook`**: Internal directory for quick staff lookups.

---

## 6. API Reference
The backend exposes the following REST endpoints. All protected routes require a `Bearer <token>` in the `Authorization` header.

### Authentication & Users (`/users`)
- `POST /login`: Authenticate user and return JWT.
- `POST /add-user`: Create a new user (Admin only).
- `GET /get-users`: List all system users.
- `DELETE /delete/:id`: Remove a user.
- `POST /change-password`: Update current user's password.

### Visitors (`/api/visitors`)
- `GET /get-visitors`: Get a list of all visit logs.
- `POST /new-visitor`: Check-in a new visitor.
    - Body: `{ guest_ID, host_ID, purpose, badge_number, ... }`
- `PUT /checkout/:id`: Check-out a visitor by Log ID.
- `GET /next-badge`: Retrieve the next available badge number.

### Hosts (`/hosts`)
- `GET /get-all`: Retrieve all registered staff members.
- `POST /add`: Add a new staff member.

### Guests (`/guests`)
- `GET /get`: List all registered guests.
- `POST /add`: Register a new guest profile.

### Reports (`/api/reports`)
- `GET /dashboard`: Get summary statistics for the dashboard.
- `GET /?type=...&from=...&to=...`: Generate specific reports based on date range.

---

## 7. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=VisiLog
JWT_SECRET=your_secure_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

> **Note**: The mobile app (`mobile/src/services/api.js`) contains a hardcoded `API_BASE` URL. Ensure this matches your backend server's IP address when running on a physical device.

---

## 8. Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server
- Expo CLI (`npm install -g expo-cli`)

### Step 1: Database Setup
1. Open your MySQL client (e.g., Workbench, Command Line).
2. Run the script located at `database/schema.sql`.
3. This will create the `VisiLog` database and all necessary tables.

### Step 2: Backend Setup
1. Navigate to `backend/`: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env` file (see Section 7).
4. Start the server:
    - Development: `npm run dev` (requires `nodemon`)
    - Production: `npm start`

### Step 3: Mobile App Setup
1. Navigate to `mobile/`: `cd mobile`
2. Install dependencies: `npm install`
3. Update `src/services/api.js`:
    - Change `API_BASE` to your computer's local IP address (e.g., `http://192.168.1.10:3001`).
4. Start the app:
    - `npx expo start`
5. Scan the QR code with the Expo Go app (Android/iOS) or press `w` for Web, `a` for Android Emulator.

---

## 9. User Flows

### Visitor Check-In (Kiosk Mode)
1. **Start**: Visitor approaches Kiosk and taps "Check In".
2. **Identification**: Visitor enters phone number.
    - *Existing*: Details auto-filled.
    - *New*: Visitor enters Name and takes a photo (optional).
3. **Host Selection**: Visitor searches and selects the Host they are visiting.
4. **Purpose**: Visitor selects purpose of visit (e.g., Meeting, Interview).
5. **Badge**: System assigns a Badge Number.
6. **Confirmation**: Check-in complete. Visitor takes badge.

### Visitor Check-Out
1. **Start**: Visitor taps "Check Out".
2. **Search**: Visitor enters Badge Number or Phone Number.
3. **Confirm**: System displays visit details. Visitor confirms check-out.
4. **End**: Visit marked as closed. Badge released.

### Admin Dashboard
1. **Login**: Admin logs in with credentials.
2. **Overview**: View "Visitors on Premises", "Total Visits Today", and "Active Hosts".
3. **Management**:
    - **Users**: Add/Remove receptionists.
    - **Reports**: Generate PDF/Excel reports for specific dates.
    - **Settings**: Configure app preferences.

---

## 10. Troubleshooting

### "Network Request Failed" on Mobile
- Ensure your phone and computer are on the **same Wi-Fi network**.
- Verify the `API_BASE` in `mobile/src/services/api.js` is correct.
- Check if your firewall is blocking port `3001`.

### Database Connection Errors
- Verify MySQL is running.
- Check `.env` credentials (`DB_USER`, `DB_PASSWORD`).
- Ensure the `VisiLog` database exists.

### Login Fails
- Check if the user exists in the `users` table.
- If it's a fresh install, manually insert an admin user into the database or use the registration endpoint if enabled.
