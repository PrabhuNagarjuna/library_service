-- schema.sql

-- Drop tables if they exist to allow for clean re-creation during development
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS members;

-- Books table to store catalog information
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Members table to store user information
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loans table to track borrowing operations
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP WITH TIME ZONE, -- NULL if not yet returned
    due_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add some initial data for testing
INSERT INTO members (name, email) VALUES
('Alice Smith', 'alice@example.com'),
('Bob Johnson', 'bob@example.com');

INSERT INTO books (title, author, isbn, is_available) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', TRUE),
('1984', 'George Orwell', '978-0451524935', TRUE),
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', TRUE),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', TRUE),
('The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', TRUE);
