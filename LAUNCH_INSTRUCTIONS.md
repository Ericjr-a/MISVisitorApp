# VisiLog Application Launch Instructions

Follow these steps to set up and launch the VisiLog Visitor Management System.

## Prerequisites
- **Node.js** (v18 or higher) installed.
- **MySQL Server** installed and running.

## 1. Database Setup
1.  Open your MySQL client (Workbench, Command Line, etc.).
2.  Create a new database (e.g., `mis_visitor_app`).
3.  Import the schema file located at:
    `database/schema.sql`
4.  Update the backend configuration:
    - Open `backend/.env` (create it if it doesn't exist, use `backend/example.env` as a reference).
    - Update the database credentials:
        ```env
        DB_HOST=localhost
        DB_USER=your_db_user
        DB_PASSWORD=your_db_password
        DB_NAME=mis_visitor_app
        PORT=3001
        JWT_SECRET=your_secret_key
        ```

## 2. Backend Setup (Server)
The backend also serves the frontend, so this is the only service you need to run.

1.  Open a terminal and navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *You should see: `Server running on port 3001`*

## 3. Accessing the Web App
- **Local Access**: Open your browser and go to:
  [http://localhost:3001/html/index.html](http://localhost:3001/html/index.html)

- **Network/VM Access**:
  1.  Find your server's IP address (run `ipconfig` or `ifconfig`).
  2.  On another device, go to: `http://<YOUR_SERVER_IP>:3001/html/index.html`

## 4. Mobile App Setup
1.  Navigate to the mobile folder:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Configure API URL**:
    - Open `src/services/api.js`.
    - Update `API_BASE` with your server's IP address:
      ```javascript
      export const API_BASE = 'http://<YOUR_SERVER_IP>:3001';
      ```
4.  Run the app:
    - **Android**: `npm run android`
    - **iOS**: `npm run ios`

## Troubleshooting
- **Database Connection Error**: Check your `.env` file credentials and ensure MySQL is running.
- **Network Access Issues**: Ensure your firewall allows traffic on port `3001`. If using VirtualBox, ensure the network adapter is set to **Bridged Adapter**.
