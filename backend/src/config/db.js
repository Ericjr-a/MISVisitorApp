import mysql from "mysql2";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create connection pool for Windows (using TCP instead of socket)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'Visilog',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    console.error("Please check:");
    console.error("1. XAMPP MySQL is running");
    console.error("2. Database credentials in .env file");
    console.error("3. Database 'Visilog' exists");
  } else {
    console.log("✅ Database connected successfully!");
    connection.release();
  }
});

export default db;