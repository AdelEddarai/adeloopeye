import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

import type { DocumentMatch } from './vector-search';
import { searchDocuments } from './vector-search';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type CreateChatStreamOptions = {
  conflictId: string;
  messages: ChatMessage[];
  onFinish?: (text: string) => Promise<void> | void;
};

const SYSTEM_PROMPT = `You are the Adeloopeye Intel Analyst — a disciplined, professional intelligence assistant embedded in a live conflict-monitoring dashboard.

Your job:
- Answer questions about events, actors, signals, military actions, diplomatic developments, and geopolitical context using ONLY the retrieved intelligence documents provided below.
- When citing information, reference the source type and title (e.g. "According to event 'US Strikes on IRGC Targets'..." or "Signal from @PentagonPressSec indicates...").
- Be precise, factual, and concise. Prefer specific claims over vague summaries.
- If the retrieved documents do not contain enough information to answer, say so clearly rather than guessing.
- Use objective language. Do not editorialize or speculate beyond what the evidence supports.
- Format responses with markdown for readability (bullet points, bold for key terms).
- Respond in the same language as the user's question.

You do NOT have access to the internet or external data. You can ONLY use the intelligence documents provided in the context below.`;

function buildContextBlock(docs: DocumentMatch[]): string {
  if (docs.length === 0) {
    return '\n<context>\nNo relevant documents found in the intelligence database.\n</context>';
  }

  const blocks = docs.map((doc, i) => {
    const meta = doc.metadata as Record<string, unknown>;
    const header = [
      `[${i + 1}]`,
      `Type: ${doc.sourceType}`,
      meta.title ? `Title: ${meta.title}` : null,
      meta.severity ? `Severity: ${meta.severity}` : null,
      meta.timestamp ? `Time: ${meta.timestamp}` : null,
      `Relevance: ${(doc.similarity * 100).toFixed(1)}%`,
    ]
      .filter(Boolean)
      .join(' | ');

    return `${header}\n${doc.content}`;
  });

  return `\n<context>\n${blocks.join('\n\n---\n\n')}\n</context>`;
}

/**
 * Create a streaming chat response using RAG.
 * Retrieves relevant documents via vector search and streams the LLM response.
 */
export async function createChatStream({ conflictId, messages, onFinish }: CreateChatStreamOptions) {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  let contextBlock = '';
  if (lastUserMessage) {
    try {
      const docs = await searchDocuments(conflictId, lastUserMessage.content, 8);
      contextBlock = buildContextBlock(docs);
    } catch {
      // Vector search may fail if table doesn't exist yet — proceed without context
      contextBlock = '\n<context>\nVector search unavailable. Responding without retrieved context.\n</context>';
    }
  }

  const systemMessage = SYSTEM_PROMPT + contextBlock;

  return streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
    async onFinish({ text }) {
      await onFinish?.(text);
    },
  });
}

export type { ChatMessage };
