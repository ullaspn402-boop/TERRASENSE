import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set.")
    sys.exit(1)

SQL_INIT = """
-- Create user table for Better Auth
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create session table
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create account table
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create verification table
CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create saved_reports table with foreign key cascade
CREATE TABLE IF NOT EXISTS saved_reports (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Multi-Hazard',
    "riskLevel" TEXT NOT NULL DEFAULT 'Moderate',
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    decision TEXT NOT NULL DEFAULT 'Monitor conditions',
    recommendation TEXT NOT NULL DEFAULT '',
    "metricsJson" TEXT,
    "parametersJson" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist if table already existed
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Multi-Hazard';
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "riskLevel" TEXT NOT NULL DEFAULT 'Moderate';
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "riskScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS decision TEXT NOT NULL DEFAULT 'Monitor conditions';
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS recommendation TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "metricsJson" TEXT;
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "parametersJson" TEXT;
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();
"""

def init_db():
    print(f"Connecting to Neon PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Applying schema for user, session, account, verification, and saved_reports...")
    cur.execute(SQL_INIT)
    print("Schema initialized successfully!")
    
    # Verify tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('user', 'session', 'account', 'verification', 'saved_reports');
    """)
    rows = cur.fetchall()
    print("Verified tables created:", [r[0] for r in rows])
    cur.close()
    conn.close()

if __name__ == "__main__":
    init_db()
