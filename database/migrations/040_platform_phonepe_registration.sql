-- Platform-level PhonePe registration payment configuration
-- and registration payment audit table.

CREATE TABLE IF NOT EXISTS platform_payment_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  test_mode TINYINT(1) NOT NULL DEFAULT 1,
  merchant_id VARCHAR(255) NULL,
  salt_key VARCHAR(255) NULL,
  salt_index INT NOT NULL DEFAULT 1,
  registration_amount DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  api_base_url VARCHAR(255) NULL,
  redirect_url VARCHAR(500) NULL,
  callback_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gateway_name (gateway_name),
  INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO platform_payment_configs
  (gateway_name, is_enabled, test_mode, salt_index, registration_amount, currency, api_base_url)
VALUES
  ('phonepe', 0, 1, 1, 1.00, 'INR', 'https://api-preprod.phonepe.com/apis/pg-sandbox')
ON DUPLICATE KEY UPDATE
  gateway_name = VALUES(gateway_name);

CREATE TABLE IF NOT EXISTS registration_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  gateway_name VARCHAR(50) NOT NULL DEFAULT 'phonepe',
  merchant_transaction_id VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('initiated', 'success', 'failed', 'pending') NOT NULL DEFAULT 'initiated',
  phonepe_response JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_id (school_id),
  INDEX idx_status (status),
  CONSTRAINT fk_registration_payments_school
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
