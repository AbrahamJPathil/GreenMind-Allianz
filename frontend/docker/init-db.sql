-- GreenMind Database Schema Initialization
-- Creates all necessary tables, indexes, and relationships

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Calculator history table
CREATE TABLE IF NOT EXISTS calculator_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calc_user_id ON calculator_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calc_created_at ON calculator_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calc_type ON calculator_history(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calc_input_data ON calculator_history USING GIN(input_data);

-- Cloud provider pricing cache table
CREATE TABLE IF NOT EXISTS cloud_pricing_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    instance_type VARCHAR(100) NOT NULL,
    pricing_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(provider, region, instance_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_provider ON cloud_pricing_cache(provider);
CREATE INDEX IF NOT EXISTS idx_pricing_expires ON cloud_pricing_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_pricing_composite ON cloud_pricing_cache(provider, region, instance_type);

-- Carbon intensity cache table
CREATE TABLE IF NOT EXISTS carbon_intensity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region VARCHAR(100) NOT NULL,
    carbon_intensity DECIMAL(10, 4) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(region, data_source)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carbon_region ON carbon_intensity_cache(region);
CREATE INDEX IF NOT EXISTS idx_carbon_expires ON carbon_intensity_cache(expires_at);

-- User sessions table (for auth tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- API request logs (for rate limiting and analytics)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, full_name) VALUES
    ('test@greenmind.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYCJIaC1LiW', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    COUNT(ch.id) as total_calculations,
    MAX(ch.created_at) as last_calculation,
    COUNT(CASE WHEN ch.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as calculations_last_week
FROM users u
LEFT JOIN calculator_history ch ON u.id = ch.user_id
GROUP BY u.id, u.email, u.full_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Tables created: users, calculator_history, cloud_pricing_cache, carbon_intensity_cache, user_sessions, api_request_logs';
    RAISE NOTICE 'Sample user created: test@greenmind.com (password: testpassword123)';
END $$;
