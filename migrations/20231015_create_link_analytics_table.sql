-- migrations/20231015_create_link_analytics_table.sql

CREATE TABLE IF NOT EXISTS link_analytics (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45), -- Supports IPv6
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100)
);
