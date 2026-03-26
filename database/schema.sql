DROP DATABASE IF EXISTS VisiLog;
CREATE DATABASE VisiLog;
USE VisiLog;

---------------------------------------
-- GUEST TABLE
---------------------------------------
CREATE TABLE guest (
  guest_ID INT AUTO_INCREMENT PRIMARY KEY,
  guest_firstname VARCHAR(50) NOT NULL,
  guest_lastname VARCHAR(50) NOT NULL,
  guest_phonenumber VARCHAR(10) NOT NULL CHECK (guest_phonenumber REGEXP '^[0-9]{10}$')
);

---------------------------------------
-- STAFF TABLE
---------------------------------------
CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,            
  staff_id VARCHAR(50) UNIQUE NOT NULL,         -- company employee ID
  staff_name VARCHAR(100) NOT NULL,
  staff_phoneNumber VARCHAR(16) NOT NULL CHECK (staff_phoneNumber REGEXP '^[0-9]{4,16}$'),
  staff_department VARCHAR(100)
);

---------------------------------------
-- NON-STAFF TABLE
---------------------------------------
CREATE TABLE nonstaff (
  nonstaff_ID INT AUTO_INCREMENT PRIMARY KEY,
  nonstaff_name VARCHAR(100) NOT NULL,
  nonstaff_phonenumber VARCHAR(16) NOT NULL CHECK (nonstaff_phonenumber REGEXP '^[0-9]{4,16}$'),
  nonstaff_department VARCHAR(100)
);

---------------------------------------
-- VISITOR LOGS
---------------------------------------
CREATE TABLE visitor_log (
  visitorLog_ID INT AUTO_INCREMENT PRIMARY KEY,
  guest_ID INT NOT NULL,
  host_ID INT NOT NULL,
  is_staff TINYINT(1) NOT NULL,   -- 1 = staff, 0 = nonstaff
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP NULL DEFAULT NULL,
  badge_number VARCHAR(10) UNIQUE,
  visit_purpose VARCHAR(255),
  checkout_notes TEXT,
  FOREIGN KEY (guest_ID) references guest(guest_ID) ON DELETE CASCADE
);

---------------------------------------
-- CALL LOGS
---------------------------------------
CREATE TABLE call_logs(
  call_log_ID INT AUTO_INCREMENT PRIMARY KEY,
  guest_ID INT,
  host_ID INT NOT NULL,
  is_staff TINYINT(1) NOT NULL,   -- 1 = staff, 0 = nonstaff
  caller_firstname VARCHAR(50),
  caller_lastname VARCHAR(50),
  call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  call_duration TIME,
  purpose VARCHAR(100),
  contact VARCHAR(16) NOT NULL CHECK (contact REGEXP '^[0-9]{4,16}$'),
  FOREIGN KEY (guest_ID) REFERENCES guest(guest_ID) ON DELETE CASCADE
);

---------------------------------------
-- PHONEBOOK
---------------------------------------
CREATE TABLE phonebook (
  phonebook_ID INT AUTO_INCREMENT PRIMARY KEY,
  pb_name VARCHAR(100) NOT NULL,
  staff_ID INT NOT NULL,
  avaya_directory VARCHAR(20),
  FOREIGN KEY (staff_ID) REFERENCES staff(id) ON DELETE CASCADE
);

---------------------------------------
-- USERS TABLE
---------------------------------------
CREATE TABLE users (
  user_ID INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  role_name ENUM('receptionist', 'supervisor', 'admin') NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwordd VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  is_first_login BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT TRUE
);

---------------------------------------
-- FINGERPRINT TABLE
---------------------------------------
CREATE TABLE fingerprint (
  fingerprint_ID INT AUTO_INCREMENT PRIMARY KEY,
  guest_ID INT,
  fingerprint_image MEDIUMBLOB NOT NULL,
  FOREIGN KEY (guest_ID) REFERENCES guest(guest_ID) ON DELETE CASCADE
);




ALTER TABLE visitor_log DROP INDEX badge_number;