import { OpenAICompatibleProvider } from "./openaiCompatible";
import type { ModelProvider } from "../harness/harness.types";

type ProviderName = "deepseek" | "openai" | "groq";

interface ProviderConfig {
  apiKeyEnv: string;
  defaultModel: string;
  baseURL?: string;
  extraParams?: Record<string, unknown>;
}

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseURL: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    // Thinking mode requires echoing reasoning_content back on tool-call turns;
    // disable it so the tool-calling harness stays simple.
    extraParams: { thinking: { type: "disabled" } },
  },
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
  },
  groq: {
    apiKeyEnv: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
  },
};

const DEFAULT_PROVIDER: ProviderName = "deepseek";

export const PROVIDER_NAMES = Object.keys(PROVIDERS) as ProviderName[];

export const resolveProviderName = (name?: string): ProviderName =>
  PROVIDER_NAMES.includes(name as ProviderName)
    ? (name as ProviderName)
    : DEFAULT_PROVIDER;

export const createProvider = (name?: string, model?: string): ModelProvider => {
  const providerName = resolveProviderName(name);
  const config = PROVIDERS[providerName];

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `Missing required environment variable: ${config.apiKeyEnv} (needed for provider "${providerName}")`,
    );
  }

  return new OpenAICompatibleProvider(1, model || config.defaultModel, {
    apiKey,
    baseURL: config.baseURL,
    extraParams: config.extraParams,
  });
};

export { DEFAULT_PROVIDER };
export type { ProviderName };
