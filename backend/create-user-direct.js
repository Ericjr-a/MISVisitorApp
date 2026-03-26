import bcrypt from 'bcrypt';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// User details you want to create
const userDetails = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',  // Change this to your desired password
    role_name: 'admin'
};

// Password hashing configuration
const saltRounds = 10;

async function createUser() {
    console.log('🔐 Starting user creation process...');
    console.log('📧 Email:', userDetails.email);
    console.log('🔑 Password:', userDetails.password);
    console.log('🔄 Hashing password...');
    
    try {
        // Step 1: Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(userDetails.password, saltRounds);
        console.log('✅ Password hashed successfully!');
        console.log('🔒 Hash:', hashedPassword);
        
        // Step 2: Create database connection
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'Visilog',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('📊 Connecting to database...');
        
        // Step 3: Connect to database
        connection.connect((err) => {
            if (err) {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            }
            console.log('✅ Connected to database successfully!');
            
            // Step 4: Check if user already exists
            const checkSql = 'SELECT * FROM users WHERE email = ?';
            connection.query(checkSql, [userDetails.email], (err, results) => {
                if (err) {
                    console.error('❌ Error checking existing user:', err.message);
                    connection.end();
                    process.exit(1);
                }
                
                if (results.length > 0) {
                    console.log('⚠️  User with this email already exists!');
                    console.log('📋 Existing user details:');
                    console.log('   ID:', results[0].user_ID);
                    console.log('   Username:', results[0].username);
                    console.log('   Email:', results[0].email);
                    console.log('   Role:', results[0].role_name);
                    console.log('');
                    console.log('🔄 Do you want to update this user?');
                    console.log('   If yes, run DELETE query first:');
                    console.log(`   DELETE FROM users WHERE email = '${userDetails.email}';`);
                    connection.end();
                    process.exit(0);
                }
                
                // Step 5: Insert new user with hashed password
                const insertSql = `
                    INSERT INTO users 
                    (username, email, passwordd, role_name, created_at, is_first_login, must_change_password) 
                    VALUES (?, ?, ?, ?, NOW(), 0, 0)
                `;
                
                const values = [
                    userDetails.username,
                    userDetails.email,
                    hashedPassword,
                    userDetails.role_name
                ];
                
                connection.query(insertSql, values, (err, result) => {
                    if (err) {
                        console.error('❌ Error inserting user:', err.message);
                        connection.end();
                        process.exit(1);
                    }
                    
                    console.log('✅ User created successfully!');
                    console.log('📋 User Details:');
                    console.log('   User ID:', result.insertId);
                    console.log('   Username:', userDetails.username);
                    console.log('   Email:', userDetails.email);
                    console.log('   Role:', userDetails.role_name);
                    console.log('   Password:', userDetails.password);
                    console.log('');
                    console.log('🎉 You can now login with these credentials!');
                    
                    connection.end();
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        process.exit(1);
    }
}

// Run the function
createUser();