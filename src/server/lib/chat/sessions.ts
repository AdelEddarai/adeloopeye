import { ChatMessageRole } from '@/generated/prisma/client';
import { prisma } from '@/server/lib/db';

type PersistedChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

function toClientRole(role: ChatMessageRole) {
  return role === ChatMessageRole.USER ? 'user' : 'assistant';
}

export async function clearCurrentChatSession(conflictId: string, visitorId: string) {
  const session = await prisma.chatSession.findFirst({
    where: { conflictId, visitorId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (!session) return null;
  await prisma.chatSession.delete({ where: { id: session.id } });
  return session.id;
}

export async function getOrCreateChatSession(conflictId: string, visitorId: string) {
  const existing = await prisma.chatSession.findFirst({
    where: { conflictId, visitorId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) return existing;

  return prisma.chatSession.create({
    data: { conflictId, visitorId },
    select: { id: true },
  });
}

export async function listChatMessages(sessionId: string): Promise<PersistedChatMessage[]> {
  const messages = await prisma.chatSessionMessage.findMany({
    where: { sessionId },
    orderBy: { ord: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return messages.map(message => ({
    id: message.id,
    role: toClientRole(message.role),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }));
}

export async function appendChatMessage(sessionId: string, role: ChatMessageRole, content: string) {
  return prisma.$transaction(async tx => {
    const previous = await tx.chatSessionMessage.findFirst({
      where: { sessionId },
      orderBy: { ord: 'desc' },
      select: { ord: true },
    });
    const ord = (previous?.ord ?? -1) + 1;
    const message = await tx.chatSessionMessage.create({
      data: { sessionId, ord, role, content },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    await tx.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessageAt: message.createdAt,
        title: role === ChatMessageRole.USER && ord === 0 ? content.slice(0, 80) : undefined,
      },
    });

    return {
      id: message.id,
      role: toClientRole(message.role),
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  });
}

export type { PersistedChatMessage };
