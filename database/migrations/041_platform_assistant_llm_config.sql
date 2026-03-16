-- Platform-level assistant LLM configuration (Gemini/OpenAI)

CREATE TABLE IF NOT EXISTS platform_assistant_llm_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  provider ENUM('gemini', 'openai') NOT NULL DEFAULT 'gemini',
  model VARCHAR(120) NULL,
  gemini_api_key VARCHAR(255) NULL,
  openai_api_key VARCHAR(255) NULL,
  timeout_ms INT NOT NULL DEFAULT 15000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO platform_assistant_llm_configs
  (is_enabled, provider, model, timeout_ms)
SELECT 0, 'gemini', 'gemini-1.5-flash', 15000
WHERE NOT EXISTS (
  SELECT 1 FROM platform_assistant_llm_configs
);

