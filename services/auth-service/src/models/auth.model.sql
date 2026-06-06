CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS auth_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
  token      VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL
);
