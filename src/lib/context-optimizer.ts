// Context optimization utilities for token economy
// Implements sliding window + local summary for chat messages

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

// Configuration
const MAX_CONTEXT_MESSAGES = 4; // Last 4 messages with full content (economy mode)
const MAX_TOKENS_PER_MESSAGE = 300; // Truncate very long messages (economy mode)

/**
 * Truncates a message to approximately the max token limit
 * Rough estimate: 1 token ≈ 4 characters
 */
function truncateMessage(content: string, maxTokens: number = MAX_TOKENS_PER_MESSAGE): string {
  const maxChars = maxTokens * 4;
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "... [truncado]";
}

/**
 * Creates a local summary of older messages (no AI call needed)
 * This is a simple extraction of key points to maintain context
 */
function createLocalSummary(messages: Message[]): string {
  if (messages.length === 0) return "";

  // Extract key information from older messages
  const userMessages = messages.filter(m => m.role === "user");
  const assistantMessages = messages.filter(m => m.role === "assistant");

  // Get the main topic from first user message
  const mainTopic = userMessages[0]?.content.slice(0, 150) || "";

  // Count interactions
  const interactionCount = messages.length;

  // Create compact summary
  let summary = `[Contexto: ${interactionCount} mensagens anteriores. `;
  summary += `Tópico inicial: "${truncateMessage(mainTopic, 50)}". `;
  
  // Get last key point from assistant if exists
  if (assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    const keyPoint = lastAssistant.content.slice(0, 100);
    summary += `Último ponto abordado: "${truncateMessage(keyPoint, 30)}"]`;
  } else {
    summary += "]";
  }

  return summary;
}

/**
 * Builds an optimized context with sliding window + summary
 * Reduces token usage by 60-80% for long conversations
 */
export function buildOptimizedContext(messages: Message[]): Message[] {
  // If conversation is short, return all messages (truncated if needed)
  if (messages.length <= MAX_CONTEXT_MESSAGES) {
    return messages.map(m => ({
      ...m,
      content: truncateMessage(m.content)
    }));
  }

  // Split messages into older and recent
  const olderMessages = messages.slice(0, -MAX_CONTEXT_MESSAGES);
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  // Create local summary of older messages
  const summary = createLocalSummary(olderMessages);

  // Build optimized context
  const optimizedContext: Message[] = [];

  // Add summary as system context in first user message position
  if (summary) {
    optimizedContext.push({
      role: "user",
      content: `${summary}\n\n---\n\nContinuando a conversa:\n\n${truncateMessage(recentMessages[0]?.content || "")}`
    });
    
    // Add remaining recent messages
    for (let i = 1; i < recentMessages.length; i++) {
      optimizedContext.push({
        ...recentMessages[i],
        content: truncateMessage(recentMessages[i].content)
      });
    }
  } else {
    // Just return truncated recent messages
    return recentMessages.map(m => ({
      ...m,
      content: truncateMessage(m.content)
    }));
  }

  return optimizedContext;
}

/**
 * Estimates token count for a message array
 * Rough estimate: 1 token ≈ 4 characters
 */
export function estimateTokens(messages: Message[]): number {
  return Math.ceil(
    messages.reduce((total, m) => total + m.content.length, 0) / 4
  );
}
