import OpenAI from 'openai';

const globalForOpenAI = globalThis as unknown as { openai?: OpenAI };

function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  globalForOpenAI.openai ??= createOpenAIClient(apiKey);
  return globalForOpenAI.openai;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/** Generate a single embedding vector for the given text. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 8000); // stay within token limits
  const res = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return res.data[0].embedding;
}

/** Generate embeddings for multiple texts in a single API call. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const trimmed = texts.map(t => t.slice(0, 8000));
  const res = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return res.data.map(d => d.embedding);
}

export { EMBEDDING_DIMENSIONS };
