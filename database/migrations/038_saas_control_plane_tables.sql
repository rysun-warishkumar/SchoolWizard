-- Phase 2 SaaS Control Plane tables (additive, non-breaking)

CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_key VARCHAR(120) NOT NULL UNIQUE,
    school_id INT NOT NULL UNIQUE,
    lifecycle_status ENUM(
      'trial',
      'active_shared',
      'provisioning_dedicated',
      'ready_for_migration',
      'migrating',
      'cutover_pending',
      'active_dedicated',
      'rollback_pending',
      'failed',
      'suspended'
    ) NOT NULL DEFAULT 'trial',
    runtime_mode ENUM('shared', 'dedicated') NOT NULL DEFAULT 'shared',
    is_readonly_freeze BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenants_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_tenants_status (lifecycle_status),
    INDEX idx_tenants_runtime_mode (runtime_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_environments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    environment_type ENUM('shared', 'dedicated') NOT NULL DEFAULT 'shared',
    environment_status ENUM('requested', 'provisioning', 'ready', 'failed', 'disabled') NOT NULL DEFAULT 'requested',
    server_host VARCHAR(255) NULL,
    app_port INT NULL,
    db_name VARCHAR(255) NULL,
    db_host VARCHAR(255) NULL,
    db_port INT NULL,
    db_user VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_environments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_env_tenant (tenant_id),
    INDEX idx_tenant_env_status (environment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    domain_type ENUM('subdomain', 'custom') NOT NULL DEFAULT 'custom',
    verification_status ENUM('pending', 'verified', 'failed') NOT NULL DEFAULT 'pending',
    dns_target VARCHAR(255) NULL,
    ssl_status ENUM('pending', 'active', 'failed') NOT NULL DEFAULT 'pending',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_domains_tenant (tenant_id),
    INDEX idx_tenant_domains_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    migration_status ENUM(
      'queued',
      'running_precheck',
      'precheck_failed',
      'exporting',
      'importing',
      'validating',
      'ready_for_cutover',
      'cutover_complete',
      'rollback_complete',
      'failed'
    ) NOT NULL DEFAULT 'queued',
    source_environment_id INT NULL,
    target_environment_id INT NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    validation_summary JSON NULL,
    error_message TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_migrations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_migrations_source_env FOREIGN KEY (source_environment_id) REFERENCES tenant_environments(id) ON DELETE SET NULL,
    CONSTRAINT fk_tenant_migrations_target_env FOREIGN KEY (target_environment_id) REFERENCES tenant_environments(id) ON DELETE SET NULL,
    INDEX idx_tenant_migrations_tenant (tenant_id),
    INDEX idx_tenant_migrations_status (migration_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    event_message TEXT NULL,
    event_payload JSON NULL,
    actor_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_events_tenant (tenant_id),
    INDEX idx_tenant_events_type (event_type),
    INDEX idx_tenant_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add linkage from schools to tenants for convenient joins
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS tenant_id INT NULL,
  ADD INDEX IF NOT EXISTS idx_schools_tenant_id (tenant_id);

-- Backfill tenants from existing schools
INSERT INTO tenants (tenant_key, school_id, lifecycle_status, runtime_mode)
SELECT CONCAT('tenant_', s.id), s.id,
       CASE WHEN s.status = 'trial' THEN 'trial' WHEN s.status = 'suspended' THEN 'suspended' ELSE 'active_shared' END,
       'shared'
FROM schools s
LEFT JOIN tenants t ON t.school_id = s.id
WHERE t.id IS NULL;

-- Backfill schools.tenant_id
UPDATE schools s
JOIN tenants t ON t.school_id = s.id
SET s.tenant_id = t.id
WHERE s.tenant_id IS NULL;
