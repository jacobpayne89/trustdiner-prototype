-- Create admin audit log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users.accounts(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit log for all admin actions and access attempts';
COMMENT ON COLUMN admin_audit_log.action IS 'Type of action performed (CREATE, UPDATE, DELETE, VIEW, etc.)';
COMMENT ON COLUMN admin_audit_log.resource_type IS 'Type of resource affected (establishment, chain, review, etc.)';
COMMENT ON COLUMN admin_audit_log.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN admin_audit_log.details IS 'Additional details about the action in JSON format';
