export type LLMProvider = 'qwen' | 'zhipu' | 'openai';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const CONFIG: LLMConfig = {
  provider: (localStorage.getItem('LLM_PROVIDER') as LLMProvider | null) ?? 'qwen',
  apiKey: localStorage.getItem('LLM_API_KEY') || '',
  baseUrl: localStorage.getItem('LLM_BASE_URL') || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: localStorage.getItem('LLM_MODEL') || 'qwen3.7-plus',
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
    return '喵？还没有配置聊天 API Key，我先用本地模式陪你。';
  }

  try {
    const response = await fetch(`${CONFIG.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一只住在用户桌面上的小猫。回复要短、温柔、有一点猫咪语气，但不要过度卖萌。',
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || `喵，我听见你说：“${message}”。`;
  } catch {
    return `喵，我现在连不上模型，但我听见你说：“${message}”。`;
  }
}
