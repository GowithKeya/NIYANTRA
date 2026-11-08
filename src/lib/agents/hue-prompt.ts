import { ProposedToolCall, AgentEvaluationTrace } from './types';

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
  /disregard\s+(?:all\s+prior|the\s+above|system\s+prompt)/i,
  /DAN\s+mode/i,
  /\bjailbreak\b/i,
  /act\s+as\s+an\s+unfiltered\s+AI/i,
  /override\s+system\s+directives/i,
  /system\s*:\s*you\s+are\s+now/i,
  /developer\s+mode\s+enabled/i,
  /bypass\s+(?:safety|security|policy|restrictions)/i
];

const DESTRUCTIVE_INTENT_PATTERNS = [
  /\bdelete\s+(?:database|db|production|table|records?|all)\b/i,
  /\bdrop\s+(?:database|table|schema)\b/i,
  /\btruncate\s+(?:table|database)\b/i,
  /\brm\s+-rf\b/i,
  /\bpurge\s+(?:all|data|logs)\b/i,
  /\bwipe\s+(?:drive|disk|server)\b/i,
  /\bexfiltrat(?:e|ion)\b/i,
  /\bsteal\s+(?:credentials|keys|tokens)\b/i
];

const BENIGN_TOOL_NAMES = new Set([
  'document_search',
  'search_docs',
  'read_faq',
  'lookup_reference',
  'get_system_status',
  'calculator'
]);

export function evaluateHuePrompt(
  originalIntent: string,
  proposedTool: ProposedToolCall
): AgentEvaluationTrace {
  const indicators: string[] = [];
  const rawIntent = originalIntent.trim();
  const argsString = typeof proposedTool.arguments === 'string'
    ? proposedTool.arguments
    : JSON.stringify(proposedTool.arguments || {});

  // 1. Prompt Injection Detection
  let promptInjectionDetected = false;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(rawIntent) || pattern.test(argsString)) {
      promptInjectionDetected = true;
      indicators.push(`Prompt Injection pattern detected: "${pattern.source}"`);
    }
  }

  // 2. Destructive Intent Detection
  let hasDestructiveIntent = false;
  for (const pattern of DESTRUCTIVE_INTENT_PATTERNS) {
    if (pattern.test(rawIntent)) {
      hasDestructiveIntent = true;
      indicators.push(`Destructive or hostile user intent detected: "${pattern.source}"`);
    }
  }

  // 3. INTENT LAUNDERING DETECTION:
  // Laundering occurs when user prompt contains destructive/hostile intent,
  // but proposed tool is nominally a benign tool (e.g. document_search)
  // or contains SQL/command injection in the argument parameters!
  const isBenignTool = BENIGN_TOOL_NAMES.has(proposedTool.name.toLowerCase());
  const argsContainDestructivePayload =
    /\b(?:DROP\s+TABLE|DROP\s+DATABASE|DELETE\s+FROM|rm\s+-rf)\b/i.test(argsString);

  if (hasDestructiveIntent && isBenignTool) {
    indicators.push(
      `Intent Laundering Caught: Destructive intent in prompt masked behind benign tool "${proposedTool.name}".`
    );
    return {
      agent: 'Hue',
      status: 'BLOCK',
      reason: `Intent Laundering Mismatch: Original prompt contains destructive intent ("${rawIntent.slice(0, 60)}...") laundered through benign tool "${proposedTool.name}".`,
      confidence: 1.0,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  if (argsContainDestructivePayload) {
    indicators.push('Tool arguments contain embedded SQL injection or destructive payload.');
    return {
      agent: 'Hue',
      status: 'BLOCK',
      reason: `Destructive payload injection detected in tool argument schema (${proposedTool.name}).`,
      confidence: 0.98,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  if (promptInjectionDetected) {
    return {
      agent: 'Hue',
      status: 'BLOCK',
      reason: 'Adversarial Prompt Injection / Instruction Override marker detected in prompt payload.',
      confidence: 0.95,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  return {
    agent: 'Hue',
    status: 'ALLOW',
    reason: 'Prompt intent and tool schema alignment verified. No injection or intent laundering markers detected.',
    confidence: 1.0,
    indicators: ['Intent alignment verified.'],
    timestamp: new Date().toISOString()
  };
}

