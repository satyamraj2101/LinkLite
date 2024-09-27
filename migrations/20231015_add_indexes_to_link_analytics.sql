-- migrations/20231015_add_indexes_to_link_analytics.sql

CREATE INDEX IF NOT EXISTS idx_link_analytics_link_id ON link_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_clicked_at ON link_analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_link_analytics_ip_address ON link_analytics(ip_address);
