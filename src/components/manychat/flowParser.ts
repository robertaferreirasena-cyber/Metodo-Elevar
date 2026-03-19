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

  // Extract message blocks - look for patterns like MSG 1, Mensagem 1, Etapa 1, etc.
  const msgRegex = /(?:###?\s*)?(?:💬\s*)?(?:MSG|Mensagem|Etapa|Bloco|Passo)\s*(\d+)[A-B]?\s*[:\-–—]\s*([^\n]+)/gi;
  let match;
  const messagePositions: { index: number; num: string; title: string }[] = [];
  
  while ((match = msgRegex.exec(markdown)) !== null) {
    messagePositions.push({
      index: match.index,
      num: match[1],
      title: match[2].trim().replace(/\*+/g, ''),
    });
  }

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

    // Extract text content - look for text blocks, "Texto:", "Bloco de texto:", etc.
    const textMatch = section.match(/(?:Texto|Bloco\s*de\s*texto|Mensagem)[:\s]*\n?([\s\S]*?)(?=\n\*?\*?(?:Quick|Bot[oõ]|Delay|Action|Tag|CTA|---|\n###|\n##))/i);
    if (textMatch) {
      node.content = textMatch[1].trim()
        .replace(/^[>\-*\s]+/gm, '')
        .replace(/\*+/g, '')
        .replace(/`+/g, '')
        .trim();
    }

    // If no specific text block found, try to get content after the title line
    if (!node.content) {
      const lines = section.split('\n').slice(1);
      const contentLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (/^(?:\*?\*?(?:Quick|Bot[oõ]|Delay|Action|Tag|CTA|Texto|Bloco))/i.test(trimmed)) break;
        if (/^[#>]/.test(trimmed)) continue;
        contentLines.push(trimmed.replace(/^[>\-*\s]+/, '').replace(/\*+/g, ''));
      }
      if (contentLines.length) node.content = contentLines.join('\n');
    }

    // Extract Quick Replies / Buttons
    const buttonMatch = section.match(/(?:Quick\s*Repl(?:y|ies)|Bot[oõ]es?|Buttons?)[:\s]*([^\n]+(?:\n(?![\n#*])[^\n]*)*)/i);
    if (buttonMatch) {
      const btns = buttonMatch[1]
        .split(/[\/|,\n]/)
        .map(b => b.trim().replace(/^[\-*•\d.)\]]+\s*/, '').replace(/\*+/g, '').replace(/`+/g, ''))
        .filter(b => b.length > 0 && b.length < 100);
      node.buttons = btns.slice(0, 13); // ManyChat limit
    }

    // Extract Delay
    const delayMatch = section.match(/Delay[:\s]*\*?\*?([^\n*]+)/i);
    if (delayMatch) {
      node.delay = delayMatch[1].trim();
      // Add delay node before this message if there's a delay
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

    // Add action node if there are tags
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

  // If no messages were found through regex, try a simpler approach
  if (messagePositions.length === 0) {
    // Look for numbered sections or bold items
    const simpleBlocks = markdown.match(/(?:^|\n)(?:\d+\.\s+|\*\*\s*\d+[.:)\]]\s*)([^\n]+)/gm);
    if (simpleBlocks) {
      simpleBlocks.slice(0, 10).forEach((block, i) => {
        flow.nodes.push({
          id: `block-${i}`,
          type: 'message',
          title: `Etapa ${i + 1}`,
          content: block.trim().replace(/^[\d.*\s]+/, '').replace(/\*+/g, ''),
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
