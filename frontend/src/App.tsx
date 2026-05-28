import React, { useState, useEffect, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AlgoStep {
  charIndex: number; // -1 = init, 0..n-1 = processing char, n = done
  char: string;
  action: 'init' | 'push' | 'pop' | 'mismatch' | 'done';
  // stack state AFTER this step (or just before for mismatch/init)
  stackBefore: string[];
  stackAfter: string[];
  activeLine: number; // 1-indexed
  message: string;
  result: boolean | null;
}

// ─── Algorithm Simulation ──────────────────────────────────────────────────

const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const OPENERS = new Set(['(', '[', '{']);

function generateSteps(input: string): AlgoStep[] {
  const steps: AlgoStep[] = [];
  const stack: string[] = [];

  steps.push({
    charIndex: -1,
    char: '',
    action: 'init',
    stackBefore: [],
    stackAfter: [],
    activeLine: 2,
    message: 'Initialized empty stack.',
    result: null,
  });

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const stackSnap = [...stack];

    if (char in PAIRS) {
      if (stack.length === 0 || stack[stack.length - 1] !== PAIRS[char]) {
        steps.push({
          charIndex: i,
          char,
          action: 'mismatch',
          stackBefore: stackSnap,
          stackAfter: [...stack],
          activeLine: 7,
          message: `'${char}' has no matching opener — returning False.`,
          result: false,
        });
        return steps;
      }
      stack.pop();
      steps.push({
        charIndex: i,
        char,
        action: 'pop',
        stackBefore: stackSnap,
        stackAfter: [...stack],
        activeLine: 8,
        message: `Popped '${PAIRS[char]}' to match '${char}'.`,
        result: null,
      });
    } else if (OPENERS.has(char)) {
      stack.push(char);
      steps.push({
        charIndex: i,
        char,
        action: 'push',
        stackBefore: stackSnap,
        stackAfter: [...stack],
        activeLine: 10,
        message: `Pushed '${char}' onto stack.`,
        result: null,
      });
    }
  }

  const isValid = stack.length === 0;
  steps.push({
    charIndex: input.length,
    char: '',
    action: 'done',
    stackBefore: [...stack],
    stackAfter: [...stack],
    activeLine: 11,
    message: isValid
      ? 'Stack is empty — string is VALID ✓'
      : 'Stack is not empty — string is INVALID ✗',
    result: isValid,
  });

  return steps;
}

// ─── Python Code Lines ─────────────────────────────────────────────────────

const CODE_LINES = [
  'def is_valid(s):',
  '    stack = []',
  '    pairs = {")": "(", "]": "[", "}": "{"}',
  '    for char in s:',
  '        if char in pairs:',
  '            if not stack or stack[-1] != pairs[char]:',
  '                return False',
  '            stack.pop()',
  '        else:',
  '            stack.append(char)',
  '    return len(stack) == 0',
];

// ─── Simple Python Syntax Tokenizer ──────────────────────────────────────

type Token = { text: string; color: string };

const PY_KEYWORDS = new Set([
  'def', 'for', 'in', 'if', 'not', 'or', 'else', 'return',
]);
const PY_BUILTINS = new Set(['len', 'True', 'False', 'None']);
const PY_VARS = new Set(['stack', 'pairs', 'char', 's']);

function tokenizePython(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    // Leading/mid spaces
    if (line[i] === ' ') {
      let j = i;
      while (j < line.length && line[j] === ' ') j++;
      tokens.push({ text: line.slice(i, j), color: '#d4d4d4' });
      i = j;
      continue;
    }
    // String literals
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== q) j++;
      j++;
      tokens.push({ text: line.slice(i, j), color: '#ce9178' });
      i = j;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), color: '#b5cea8' });
      i = j;
      continue;
    }
    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let color = '#d4d4d4';
      if (PY_KEYWORDS.has(word)) color = '#569cd6';
      else if (PY_BUILTINS.has(word)) color = '#dcdcaa';
      else if (word === 'is_valid') color = '#dcdcaa';
      else if (PY_VARS.has(word)) color = '#9cdcfe';
      tokens.push({ text: word, color });
      i = j;
      continue;
    }
    // Operators and punctuation
    tokens.push({ text: line[i], color: '#d4d4d4' });
    i++;
  }
  return tokens;
}

// ─── Button helper ─────────────────────────────────────────────────────────

function btnStyle(disabled: boolean, accent = false): React.CSSProperties {
  return {
    background: accent ? '#f59e0b' : disabled ? '#191919' : '#2a2a2a',
    border: `1px solid ${disabled ? '#2a2a2a' : accent ? '#f59e0b' : '#444'}`,
    borderRadius: 8,
    color: accent ? '#000' : disabled ? '#383838' : '#e2e8f0',
    padding: '9px 18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  };
}

// ─── Main Component ────────────────────────────────────────────────────────

const DEFAULT_INPUT = '{[({})]}(){]';

export const App: React.FC = () => {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [editingInput, setEditingInput] = useState(DEFAULT_INPUT);
  const [steps, setSteps] = useState<AlgoStep[]>(() => generateSteps(DEFAULT_INPUT));
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[stepIndex];
  const isAtEnd = stepIndex >= steps.length - 1;
  const isAtStart = stepIndex === 0;

  useEffect(() => {
    const newSteps = generateSteps(input);
    setSteps(newSteps);
    setStepIndex(0);
    setIsPlaying(false);
  }, [input]);

  useEffect(() => {
    if (!isPlaying) return;
    if (isAtEnd) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setStepIndex(i => i + 1), speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stepIndex, isAtEnd, speed]);

  const handlePlay = () => {
    if (isAtEnd) setStepIndex(0);
    setIsPlaying(p => !p);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInput(editingInput.trim() || DEFAULT_INPUT);
  };

  // ── Derived display values ──

  const actionLabel = () => {
    switch (step.action) {
      case 'push':     return 'Push';
      case 'pop':      return 'Pop';
      case 'mismatch': return 'Invalid';
      case 'done':     return step.result ? 'Valid ✓' : 'Invalid ✗';
      default:         return '—';
    }
  };

  const actionColor = () => {
    switch (step.action) {
      case 'push':     return '#22c55e';
      case 'pop':      return '#3b82f6';
      case 'mismatch': return '#ef4444';
      case 'done':     return step.result ? '#22c55e' : '#ef4444';
      default:         return '#6b7280';
    }
  };

  const msgBorderColor = () => {
    if (step.result === false || step.action === 'mismatch') return '#ef4444';
    if (step.result === true) return '#22c55e';
    if (step.action === 'push') return '#22c55e';
    if (step.action === 'pop') return '#3b82f6';
    return '#444';
  };

  // For displaying stack: when popping, show stackBefore with top highlighted
  const displayStack = step.action === 'pop' ? step.stackBefore : step.stackAfter;
  const poppedIndex = step.action === 'pop' ? step.stackBefore.length - 1 : -1;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#f1f5f9',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 16px 48px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* ── Title ── */}
        <h1 style={{
          fontSize: 30,
          fontWeight: 800,
          textAlign: 'center',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Valid Parentheses
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: 14,
          textAlign: 'center',
          margin: '6px 0 28px',
        }}>
          Ensure every opening bracket has a match.
        </p>

        {/* ── Current Char + Action ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: 24,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Current Char
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 800,
              fontFamily: 'monospace',
              lineHeight: 1,
              minHeight: 64,
              color: step.char ? '#f1f5f9' : '#374151',
            }}>
              {step.char || '—'}
            </div>
          </div>
          <div style={{ width: 1, background: '#1e2a3a' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Action
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: actionColor(),
              paddingTop: 12,
              minHeight: 64,
              lineHeight: 1,
            }}>
              {actionLabel()}
            </div>
          </div>
        </div>

        {/* ── Character Sequence ── */}
        <div style={{
          background: '#161b22',
          borderRadius: 12,
          padding: '14px 12px',
          marginBottom: 24,
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
            {input.split('').map((char, i) => {
              const isPast = i < step.charIndex;
              const isCurrent = i === step.charIndex;
              return (
                <div
                  key={i}
                  style={{
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    background: isCurrent ? '#f59e0b' : 'transparent',
                    border: `2px solid ${
                      isCurrent ? '#f59e0b' : isPast ? '#22c55e' : '#2d3748'
                    }`,
                    color: isCurrent ? '#000' : isPast ? '#22c55e' : '#4b5563',
                    boxShadow: isCurrent ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
                  }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stack Section ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 14,
            color: '#e2e8f0',
          }}>
            Stack
          </div>

          {/* Push / Pop action display */}
          {(step.action === 'push' || step.action === 'pop') && (
            <div style={{
              fontFamily: 'monospace',
              fontSize: 30,
              fontWeight: 700,
              marginBottom: 14,
              color: '#cbd5e1',
            }}>
              {step.action === 'push' ? 'Push' : 'Pop'}
              <span style={{ color: '#475569' }}>(</span>
              <span style={{ color: '#f59e0b', margin: '0 2px' }}>
                {step.action === 'push' ? step.char : PAIRS[step.char]}
              </span>
              <span style={{ color: '#475569' }}>)</span>
            </div>
          )}

          {step.action === 'mismatch' && (
            <div style={{
              fontFamily: 'monospace',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 14,
              color: '#ef4444',
            }}>
              No match for &apos;{step.char}&apos;!
            </div>
          )}

          {/* Stack items visualization */}
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            minHeight: 52,
            alignItems: 'center',
          }}>
            {displayStack.length === 0 ? (
              <div style={{
                color: '#374151',
                fontSize: 13,
                fontStyle: 'italic',
              }}>
                {step.action === 'done' && step.result
                  ? 'empty — all matched ✓'
                  : 'empty'}
              </div>
            ) : (
              displayStack.map((item, i) => {
                const isPopping = i === poppedIndex;
                return (
                  <div
                    key={i}
                    style={{
                      width: 46,
                      height: 46,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isPopping ? '#1e3a5f' : '#1e2a3a',
                      border: `2px solid ${isPopping ? '#3b82f6' : '#2d3748'}`,
                      borderRadius: 8,
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: isPopping ? '#60a5fa' : '#94a3b8',
                      boxShadow: isPopping ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {item}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Status Message ── */}
        <div style={{
          padding: '10px 14px',
          background: '#161b22',
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 13,
          color: '#94a3b8',
          borderLeft: `3px solid ${msgBorderColor()}`,
        }}>
          {step.message}
        </div>

        {/* ── Code Block ── */}
        <div style={{
          background: '#1e1e1e',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontSize: 13,
          border: '1px solid #2d3748',
        }}>
          {CODE_LINES.map((lineText, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === step.activeLine;
            const tokens = tokenizePython(lineText);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#f59e0b' : 'transparent'}`,
                }}
              >
                <span style={{
                  minWidth: 38,
                  paddingLeft: 8,
                  paddingRight: 12,
                  textAlign: 'right',
                  color: isActive ? '#f59e0b' : '#4b5563',
                  userSelect: 'none',
                  fontSize: 11,
                  lineHeight: '22px',
                  flexShrink: 0,
                }}>
                  {lineNum}
                </span>
                <span style={{ lineHeight: '22px', paddingRight: 12, whiteSpace: 'pre' }}>
                  {tokens.map((tok, j) => (
                    <span key={j} style={{ color: tok.color }}>{tok.text}</span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Controls ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 24,
        }}>
          <button
            onClick={() => setStepIndex(i => Math.max(0, i - 1))}
            disabled={isAtStart}
            style={btnStyle(isAtStart)}
          >
            ◀ Back
          </button>

          <button onClick={handlePlay} style={btnStyle(false, true)}>
            {isPlaying ? '⏸ Pause' : isAtEnd ? '↺ Replay' : '▶ Play'}
          </button>

          <button
            onClick={() => setStepIndex(i => Math.min(steps.length - 1, i + 1))}
            disabled={isAtEnd}
            style={btnStyle(isAtEnd)}
          >
            Next ▶
          </button>

          <button
            onClick={() => { setStepIndex(0); setIsPlaying(false); }}
            style={btnStyle(false)}
          >
            ↺ Reset
          </button>

          <select
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{
              background: '#1e2a3a',
              color: '#e2e8f0',
              border: '1px solid #2d3748',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value={1500}>Slow</option>
            <option value={900}>Normal</option>
            <option value={400}>Fast</option>
            <option value={150}>Very Fast</option>
          </select>
        </div>

        {/* ── Step Counter ── */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{
            background: '#161b22',
            border: '1px solid #2d3748',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 12,
            color: '#64748b',
          }}>
            Step {stepIndex} / {steps.length - 1}
          </span>
        </div>

        {/* ── Result Banner ── */}
        {step.result !== null && (
          <div style={{
            textAlign: 'center',
            padding: '14px',
            borderRadius: 10,
            background: step.result ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${step.result ? '#22c55e' : '#ef4444'}`,
            fontSize: 18,
            fontWeight: 700,
            color: step.result ? '#22c55e' : '#ef4444',
            marginBottom: 24,
          }}>
            {step.result ? '✓ Valid Parentheses' : '✗ Invalid Parentheses'}
          </div>
        )}

        {/* ── Input Editor ── */}
        <form onSubmit={handleInputSubmit}>
          <div style={{
            fontSize: 11,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}>
            Try your own input
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={editingInput}
              onChange={e => setEditingInput(e.target.value)}
              placeholder="e.g. {[()]} or ([)]"
              style={{
                flex: 1,
                background: '#161b22',
                border: '1px solid #2d3748',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f1f5f9',
                fontSize: 16,
                fontFamily: 'monospace',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = '#2d3748')}
            />
            <button type="submit" style={{
              background: '#1e2a3a',
              border: '1px solid #2d3748',
              borderRadius: 8,
              color: '#e2e8f0',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>
              Visualize
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
