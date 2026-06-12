export type LLMProvider = 'zhipu' | 'qwen' | 'openai';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
}

// In a real app, you would load this from an env or a secure store
const CONFIG: LLMConfig = {
  provider: 'zhipu', 
  apiKey: localStorage.getItem('LLM_API_KEY') || ''
};

export const setApiKey = (key: string) => {
  localStorage.setItem('LLM_API_KEY', key);
  CONFIG.apiKey = key;
};

export const setProvider = (provider: LLMProvider) => {
  localStorage.setItem('LLM_PROVIDER', provider);
  CONFIG.provider = provider;
};

export async function chatWithCat(message: string): Promise<string> {
  if (!CONFIG.apiKey) {
    return '（喵呜？请先配置 API Key 喵~）';
  }

  // Generic LLM fetch wrapper (mocked for now, depending on actual Zhipu/Qwen API endpoint)
  // For demonstration, let's just simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`喵！你刚才说的是 "${message}" 吗？`);
    }, 1000);
  });
}
