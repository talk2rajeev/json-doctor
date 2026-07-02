import OpenAI from 'openai';

export interface ChatCompletionRequest {
  apiKey: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export const openaiService = {
  // Generate chat completion
  async generateChatCompletion({
    apiKey,
    prompt,
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7,
  }: ChatCompletionRequest): Promise<string> {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No response received from OpenAI');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  },

  // Generate chat completion with conversation history
  async generateChatCompletionWithHistory(
    apiKey: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: { model?: string; maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const completion = await openai.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages.map(msg => ({ role: msg.role as any, content: msg.content })),
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No response received from OpenAI');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  },

  // Generate chat completion with streaming
  async *generateChatCompletionStream(
    apiKey: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: { model?: string; maxTokens?: number; temperature?: number } = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const stream = await openai.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages.map(msg => ({ role: msg.role as any, content: msg.content })),
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  },
};
