import { createHash } from 'crypto';

export function hashDocumentContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
