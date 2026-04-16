export interface FlowNode {
  id: string;
  type: 'trigger' | 'message' | 'condition' | 'action' | 'delay';
  title: string;
  content?: string;
  buttons?: string[];
  delay?: string;
  tags?: string[];
  customFields?: string[];
  action?: string;
}

export interface ParsedFlow {
  name: string;
  trigger: string;
  objective: string;
  steps: number;
  estimatedTime: string;
  nodes: FlowNode[];
  abTestA?: string;
  abTestB?: string;
  kpis?: string[];
  technicalConfig?: {
    tags: string[];
    customFields: string[];
    conditions: string[];
    delays: string[];
  };
}

export function parseFlowMarkdown(markdown: string): ParsedFlow {
  const flow: ParsedFlow = {
    name: '',
    trigger: '',
    objective: '',
    steps: 0,
    estimatedTime: '',
    nodes: [],
  };

  if (!markdown) return flow;

  // Extract flow overview
  const nameMatch = markdown.match(/Nome\s*(?:do\s*fluxo)?[:\s]*\*?\*?([^\n*]+)/i);
  if (nameMatch) flow.name = nameMatch[1].trim();

  const triggerMatch = markdown.match(/Trigger\s*(?:\(gatilho\))?[:\s]*\*?\*?([^\n*]+)/i);
  if (triggerMatch) flow.trigger = triggerMatch[1].trim();

  const objectiveMatch = markdown.match(/Objetivo[:\s]*\*?\*?([^\n*]+)/i);
  if (objectiveMatch) flow.objective = objectiveMatch[1].trim();

  const stepsMatch = markdown.match(/(?:N[uú]mero\s*de\s*etapas|Etapas)[:\s]*\*?\*?(\d+)/i);
  if (stepsMatch) flow.steps = parseInt(stepsMatch[1]);

  const timeMatch = markdown.match(/Tempo\s*estimado[^:]*[:\s]*\*?\*?([^\n*]+)/i);
  if (timeMatch) flow.estimatedTime = timeMatch[1].trim();

  // Extract trigger node
  const triggerText = flow.trigger || 'Trigger não definido';
  flow.nodes.push({
    id: 'trigger-0',
    type: 'trigger',
    title: 'Trigger',
    content: triggerText,
  });

  // --- Strategy 1: Standard patterns (MSG 1, Mensagem 1, Etapa 1, etc.) ---
  const msgPatterns = [
    // MSG 1: Title, Mensagem 1: Title, Etapa 1: Title, etc.
    /(?:###?\s*)?(?:💬\s*)?(?:MSG|Mensagem|Etapa|Bloco|Passo)\s*(\d+)\s*[A-B]?\s*[:\-–—.)\]]\s*([^\n]+)/gi,
    // **MSG 1:** Title or **Mensagem 1:** Title
    /\*\*\s*(?:MSG|Mensagem|Etapa|Bloco|Passo)\s*(\d+)\s*[A-B]?\s*[:\-–—.)\]]\s*\*?\*?\s*([^\n]+)/gi,
    // Numbered headers: ### 1. Title or ## 1. Title (inside message sections)
    /(?:###?\s+)(\d+)\.\s+([^\n]+)/gi,
  ];

  let messagePositions: { index: number; num: string; title: string }[] = [];

  for (const regex of msgPatterns) {
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      // Avoid duplicates at same index
      const isDuplicate = messagePositions.some(p => Math.abs(p.index - match!.index) < 20);
      if (!isDuplicate) {
        messagePositions.push({
          index: match.index,
          num: match[1],
          title: match[2].trim().replace(/\*+/g, ''),
        });
      }
    }
  }

  // Sort by position in markdown
  messagePositions.sort((a, b) => a.index - b.index);

  // Deduplicate by num (keep first occurrence)
  const seenNums = new Set<string>();
  messagePositions = messagePositions.filter(p => {
    if (seenNums.has(p.num)) return false;
    seenNums.add(p.num);
    return true;
  });

  // For each message, extract content between this message and the next
  for (let i = 0; i < messagePositions.length; i++) {
    const start = messagePositions[i].index;
    const end = i < messagePositions.length - 1 ? messagePositions[i + 1].index : markdown.length;
    const section = markdown.slice(start, end);

    const node: FlowNode = {
      id: `msg-${messagePositions[i].num}-${i}`,
      type: 'message',
      title: `MSG ${messagePositions[i].num}: ${messagePositions[i].title}`,
      content: '',
      buttons: [],
      tags: [],
    };

    // Extract text content - multiple patterns
    const textPatterns = [
      /(?:Texto|Bloco\s*de\s*texto|Mensagem|Conte[uú]do)[:\s]*\n?([\s\S]*?)(?=\n\*?\*?(?:Quick|Bot[oõ]|Delay|Action|Tag|CTA|---|\n###|\n##))/i,
      /(?:Texto|Bloco\s*de\s*texto|Conte[uú]do)[:\s]*\*?\*?\n?([\s\S]*?)(?=\n\s*\*?\*?(?:Quick|Bot[oõ]|Delay|Action|Tag|CTA|---|\n###|\n##|$))/i,
    ];

    for (const pattern of textPatterns) {
      const textMatch = section.match(pattern);
      if (textMatch) {
        node.content = cleanContent(textMatch[1]);
        break;
      }
    }

    // If no specific text block found, try to get content after the title line
    if (!node.content) {
      node.content = extractFallbackContent(section);
    }

    // Extract Quick Replies / Buttons - expanded patterns
    const buttonPatterns = [
      /(?:Quick\s*Repl(?:y|ies)|Bot[oõ]es?|Buttons?|CTAs?)[:\s]*([^\n]+(?:\n(?![\n#*\-])[^\n]*)*)/i,
      /(?:Quick\s*Repl(?:y|ies)|Bot[oõ]es?|Buttons?)[:\s]*\n((?:\s*[-•*]\s*[^\n]+\n?)+)/i,
    ];

    for (const pattern of buttonPatterns) {
      const buttonMatch = section.match(pattern);
      if (buttonMatch) {
        const btns = buttonMatch[1]
          .split(/[\/|,\n]/)
          .map(b => b.trim().replace(/^[\-*•\d.)\]]+\s*/, '').replace(/\*+/g, '').replace(/`+/g, '').replace(/^["']|["']$/g, ''))
          .filter(b => b.length > 0 && b.length < 100);
        node.buttons = btns.slice(0, 13);
        break;
      }
    }

    // Extract Delay
    const delayMatch = section.match(/Delay[:\s]*\*?\*?([^\n*]+)/i);
    if (delayMatch) {
      node.delay = delayMatch[1].trim();
      if (node.delay && i > 0) {
        flow.nodes.push({
          id: `delay-${i}`,
          type: 'delay',
          title: 'Smart Delay',
          content: node.delay,
        });
      }
    }

    // Extract Actions/Tags
    const actionMatch = section.match(/Action[:\s]*\*?\*?([^\n*]+)/i);
    if (actionMatch) node.action = actionMatch[1].trim();

    const tagMatch = section.match(/Tags?\s*(?:sugeridas?)?[:\s]*\*?\*?([^\n*]+)/i);
    if (tagMatch) {
      node.tags = tagMatch[1].split(/[,|]/).map(t => t.trim().replace(/[`"']/g, '')).filter(Boolean);
    }

    flow.nodes.push(node);

    if (node.tags && node.tags.length > 0) {
      flow.nodes.push({
        id: `action-${i}`,
        type: 'action',
        title: 'Ação',
        content: node.action || `Adicionar Tags: ${node.tags.join(', ')}`,
        tags: node.tags,
      });
    }
  }

  // --- Strategy 2: Fallback - split by markdown headers (##/###) ---
  if (messagePositions.length === 0) {
    const messageSectionMatch = markdown.match(/(?:TEXTOS|MENSAGENS|TEXTOS DAS MENSAGENS)[^\n]*\n([\s\S]*?)(?=\n##\s|$)/i);
    const searchArea = messageSectionMatch ? messageSectionMatch[1] : markdown;

    // Try splitting by ### or ## headers within the messages section
    const headerBlocks = searchArea.split(/\n(?=#{2,3}\s+)/);
    let msgCount = 0;

    for (const block of headerBlocks) {
      const headerMatch = block.match(/^#{2,3}\s+(.+)/);
      if (!headerMatch) continue;
      const title = headerMatch[1].replace(/\*+/g, '').trim();
      
      // Skip non-message headers (overview, config, etc.)
      if (/visão geral|diagrama|configura|teste a\/b|kpi|técnic/i.test(title)) continue;
      
      msgCount++;
      const node: FlowNode = {
        id: `fallback-${msgCount}`,
        type: 'message',
        title: `MSG ${msgCount}: ${title}`,
        content: extractFallbackContent(block),
        buttons: [],
      };

      // Extract buttons from this block
      const btnMatch = block.match(/(?:Quick|Bot[oõ]|Button)[^\n]*[:\s]*([^\n]+)/i);
      if (btnMatch) {
        node.buttons = btnMatch[1].split(/[\/|,]/)
          .map(b => b.trim().replace(/\*+/g, '').replace(/`+/g, ''))
          .filter(b => b.length > 0 && b.length < 100);
      }

      const delayMatch = block.match(/Delay[:\s]*\*?\*?([^\n*]+)/i);
      if (delayMatch) node.delay = delayMatch[1].trim();

      flow.nodes.push(node);
    }
  }

  // --- Strategy 3: Last resort - extract from code block diagram + raw text ---
  const messageNodeCount = flow.nodes.filter(n => n.type === 'message').length;
  if (messageNodeCount === 0) {
    // Try to find [MSG X: ...] patterns in code blocks
    const codeBlockMsgs = [...markdown.matchAll(/\[MSG\s*(\d+)[A-B]?\s*:\s*([^\]]+)\]/gi)];
    if (codeBlockMsgs.length > 0) {
      for (let i = 0; i < codeBlockMsgs.length; i++) {
        flow.nodes.push({
          id: `diagram-${i}`,
          type: 'message',
          title: `MSG ${codeBlockMsgs[i][1]}: ${codeBlockMsgs[i][2].trim()}`,
          content: codeBlockMsgs[i][2].trim(),
        });
      }
    } else {
      // Absolute fallback: split markdown into paragraphs and use as messages
      const paragraphs = markdown
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 20 && !p.startsWith('#') && !p.startsWith('```') && !p.startsWith('---'));
      
      // Take first 7 meaningful paragraphs as messages
      paragraphs.slice(0, 7).forEach((para, i) => {
        flow.nodes.push({
          id: `raw-${i}`,
          type: 'message',
          title: `Etapa ${i + 1}`,
          content: para.replace(/\*+/g, '').replace(/^[-•*]\s*/gm, '').substring(0, 500),
        });
      });
    }
  }

  // Extract A/B Test
  const abSection = markdown.match(/(?:Teste?\s*A\/?B|Varia[çc][ãa]o)[^]*?(?:Varia[çc][ãa]o\s*A[:\s]*([^\n]+))/i);
  if (abSection) flow.abTestA = abSection[1]?.trim();
  const abB = markdown.match(/Varia[çc][ãa]o\s*B[:\s]*([^\n]+)/i);
  if (abB) flow.abTestB = abB[1]?.trim();

  // Extract KPIs
  const kpiSection = markdown.match(/KPI[s]?\s*(?:sugeridos?)?[^]*?((?:[-•*]\s*[^\n]+\n?)+)/i);
  if (kpiSection) {
    flow.kpis = kpiSection[1].split('\n')
      .map(l => l.trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, ''))
      .filter(l => l.length > 5);
  }

  // Extract technical config
  const tagsSection = markdown.match(/Tags?\s*sugeridas?[:\s]*([^\n]+(?:\n(?![\n#])[^\n]*)*)/i);
  const cfSection = markdown.match(/Custom\s*Fields?[:\s]*([^\n]+(?:\n(?![\n#])[^\n]*)*)/i);
  const condSection = markdown.match(/Condi[çc][oõ]es?[:\s]*([^\n]+(?:\n(?![\n#])[^\n]*)*)/i);

  if (tagsSection || cfSection || condSection) {
    flow.technicalConfig = {
      tags: tagsSection ? tagsSection[1].split(/[,\n]/).map(t => t.trim().replace(/^[-•*]\s*/, '').replace(/[`"'*]/g, '')).filter(Boolean) : [],
      customFields: cfSection ? cfSection[1].split(/[,\n]/).map(t => t.trim().replace(/^[-•*]\s*/, '').replace(/[`"'*]/g, '')).filter(Boolean) : [],
      conditions: condSection ? condSection[1].split(/[,\n]/).map(t => t.trim().replace(/^[-•*]\s*/, '').replace(/[`"'*]/g, '')).filter(Boolean) : [],
      delays: [],
    };
  }

  return flow;
}

function cleanContent(text: string): string {
  return text.trim()
    .replace(/^[>\-*\s]+/gm, '')
    .replace(/\*+/g, '')
    .replace(/`+/g, '')
    .trim();
}

function extractFallbackContent(section: string): string {
  const lines = section.split('\n').slice(1);
  const contentLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Stop at known section markers
    if (/^(?:\*?\*?(?:Quick|Bot[oõ]|Delay|Action|Tag|CTA|Texto|Bloco|Configura|###|##))/i.test(trimmed)) break;
    if (/^```/.test(trimmed)) break;
    if (/^[#>]/.test(trimmed)) continue;
    contentLines.push(trimmed.replace(/^[>\-*•\s]+/, '').replace(/\*+/g, ''));
  }
  return contentLines.join('\n') || '';
}
