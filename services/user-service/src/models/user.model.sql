CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Provient de l'Auth Service
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    language_preference VARCHAR(10) DEFAULT 'fr',
    theme_preference VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);