import bcrypt from 'bcrypt';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const password = 'admin123';
const saltRounds = 10;

async function createUser() {
    try {
        // Generate hash
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Generated hash for admin123:', hash);
        
        // Create connection
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'Visilog'
        });
        
        // First, delete any existing admin user
        connection.query('DELETE FROM users WHERE email = ?', ['admin@example.com'], (err) => {
            if (err) console.error('Error deleting existing user:', err);
            
            // Insert new user
            const sql = `INSERT INTO users 
                        (username, email, passwordd, role_name, created_at, is_first_login, must_change_password) 
                        VALUES (?, ?, ?, ?, NOW(), 0, 0)`;
            
            connection.query(sql, ['admin', 'admin@example.com', hash, 'admin'], (err, result) => {
                if (err) {
                    console.error('Insert error:', err);
                } else {
                    console.log('✓ User created successfully!');
                    console.log('User ID:', result.insertId);
                    console.log('\nLogin with:');
                    console.log('Email: admin@example.com');
                    console.log('Password: admin123');
                }
                connection.end();
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

createUser();