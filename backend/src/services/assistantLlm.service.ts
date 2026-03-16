import https from 'https';
import { env } from '../config/env';
import { getDatabase } from '../config/database';

type LlmProvider = 'gemini' | 'openai';

type AssistantLlmInput = {
  userMessage: string;
  schoolId: number | null;
  userRole: string;
  userName?: string;
  context?: Record<string, any>;
};

type AssistantRuntimeConfig = {
  enabled: boolean;
  provider: LlmProvider;
  model: string;
  geminiApiKey: string;
  openaiApiKey: string;
  timeoutMs: number;
};

const postJson = async (
  url: string,
  payload: Record<string, any>,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ statusCode: number; body: any }> => {
  const serialized = JSON.stringify(payload);
  const parsed = new URL(url);
  const options: https.RequestOptions = {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: `${parsed.pathname}${parsed.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serialized),
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let parsedBody: any = raw;
        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch {
          parsedBody = { raw };
        }
        resolve({
          statusCode: Number(res.statusCode || 500),
          body: parsedBody,
        });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('LLM request timeout'));
    });
    req.on('error', reject);
    req.write(serialized);
    req.end();
  });
};

const extractText = (value: any): string => String(value || '').trim();

const buildSystemPrompt = (): string =>
  [
    'You are SchoolWizard Assistant for a multi-school ERP.',
    'Rules:',
    '- Never claim data beyond provided context.',
    '- Keep answers concise and practical.',
    '- If data is missing, say what is missing and suggest next question.',
    '- Respect school isolation and role boundaries.',
  ].join('\n');

const buildUserPrompt = (input: AssistantLlmInput): string => {
  const context = input.context ? JSON.stringify(input.context, null, 2) : '{}';
  return [
    `User role: ${input.userRole || 'unknown'}`,
    `School ID: ${input.schoolId == null ? 'platform-context' : input.schoolId}`,
    `User name: ${input.userName || 'N/A'}`,
    `Context data: ${context}`,
    '',
    `Question: ${input.userMessage}`,
  ].join('\n');
};

const loadRuntimeConfig = async (): Promise<AssistantRuntimeConfig> => {
  const fallback: AssistantRuntimeConfig = {
    enabled: Boolean(env.assistant.enabled),
    provider: (extractText(env.assistant.provider) || 'gemini') as LlmProvider,
    model: extractText(env.assistant.model),
    geminiApiKey: extractText(env.assistant.geminiApiKey),
    openaiApiKey: extractText(env.assistant.openaiApiKey),
    timeoutMs: Number(env.assistant.timeoutMs || 15000),
  };

  try {
    const db = getDatabase();
    const [rows] = await db.execute(
      `SELECT is_enabled, provider, model, gemini_api_key, openai_api_key, timeout_ms
       FROM platform_assistant_llm_configs
       ORDER BY id ASC
       LIMIT 1`
    ) as any[];

    if (!rows?.length) return fallback;
    const row = rows[0] || {};
    return {
      enabled: Boolean(row.is_enabled),
      provider: (extractText(row.provider) || fallback.provider) as LlmProvider,
      model: extractText(row.model) || fallback.model,
      geminiApiKey: extractText(row.gemini_api_key) || fallback.geminiApiKey,
      openaiApiKey: extractText(row.openai_api_key) || fallback.openaiApiKey,
      timeoutMs: Number(row.timeout_ms || fallback.timeoutMs || 15000),
    };
  } catch {
    return fallback;
  }
};

const callOpenAi = async (input: AssistantLlmInput, config: AssistantRuntimeConfig): Promise<string | null> => {
  const apiKey = extractText(config.openaiApiKey);
  if (!apiKey) return null;

  const model = extractText(config.model) || 'gpt-4o-mini';
  const response = await postJson(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.2,
      max_tokens: 320,
    },
    {
      Authorization: `Bearer ${apiKey}`,
    },
    config.timeoutMs
  );

  if (response.statusCode < 200 || response.statusCode >= 300) return null;
  return extractText(response.body?.choices?.[0]?.message?.content);
};

const callGemini = async (input: AssistantLlmInput, config: AssistantRuntimeConfig): Promise<string | null> => {
  const apiKey = extractText(config.geminiApiKey);
  if (!apiKey) return null;

  const model = extractText(config.model) || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await postJson(
    url,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${buildSystemPrompt()}\n\n${buildUserPrompt(input)}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 320,
      },
    },
    {},
    config.timeoutMs
  );

  if (response.statusCode < 200 || response.statusCode >= 300) return null;
  return extractText(response.body?.candidates?.[0]?.content?.parts?.[0]?.text);
};

export const generateAssistantReply = async (input: AssistantLlmInput): Promise<string | null> => {
  const runtime = await loadRuntimeConfig();
  if (!runtime.enabled) return null;

  const provider = (extractText(runtime.provider) || 'gemini') as LlmProvider;
  try {
    if (provider === 'openai') return await callOpenAi(input, runtime);
    return await callGemini(input, runtime);
  } catch {
    return null;
  }
};

