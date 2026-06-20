'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  Copilot Bridge — VS Code Extension
//  Starts a local HTTP server (localhost:3456) that:
//    • Serves the web UI
//    • Exposes editor/debug context to the browser
//    • Routes chat requests through vscode.lm (the official Copilot LM API)
// ─────────────────────────────────────────────────────────────────────────────

const vscode = require('vscode');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const PORT = 3456;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonReply(res, data, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let b = '';
    req.on('data', c => {
      b += c;
      if (Buffer.byteLength(b, 'utf8') > MAX_BODY_BYTES) {
        fail(new Error('Request body too large'));
        req.destroy();
      }
    }).on('end', () => ok(b)).on('error', fail);
  });
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeCommand(input) {
  const now = new Date().toISOString();
  const clean = {
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : `cmd_${Date.now()}`,
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Untitled',
    category: typeof input.category === 'string' && input.category.trim() ? input.category.trim() : 'General',
    template: typeof input.template === 'string' ? input.template : '',
    includeEditorContext: input.includeEditorContext !== false,
    includeDebugContext: !!input.includeDebugContext,
    includeDiagnostics: !!input.includeDiagnostics,
    openInPanel: !!input.openInPanel,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: now,
  };
  return clean;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Default command library ───────────────────────────────────────────────────

function getDefaults() {
  const now = new Date().toISOString();
  return [
    {
      id: 'explain', name: 'Explain Code', category: 'Analysis',
      includeEditorContext: true,
      template: 'Explain this {{language}} code step by step. Describe what each part does, the overall logic flow, and any important patterns or concepts used.',
    },
    {
      id: 'fix', name: 'Fix Bug', category: 'Debug',
      includeEditorContext: true,
      template: 'Analyze this {{language}} code for bugs, errors, and issues. List each problem with an explanation, then provide the complete corrected code.',
    },
    {
      id: 'tests', name: 'Unit Tests', category: 'Testing',
      includeEditorContext: true,
      template: 'Write comprehensive unit tests for this {{language}} code. Cover: happy path, edge cases, error/exception scenarios. Use the standard testing framework for {{language}}.',
    },
    {
      id: 'gherkin', name: 'BDD / Gherkin Scenarios', category: 'Testing',
      includeEditorContext: true,
      template: 'Write Gherkin BDD test scenarios (Feature / Scenario / Given / When / Then) for this {{language}} code. Cover happy path, negative cases, and boundary conditions.',
    },
    {
      id: 'refactor', name: 'Refactor', category: 'Quality',
      includeEditorContext: true,
      template: 'Refactor this {{language}} code for better readability, maintainability, and quality. Show the improved version and briefly explain each key change.',
    },
    {
      id: 'review', name: 'Code Review', category: 'Quality',
      includeEditorContext: true,
      template: 'Perform a thorough code review of this {{language}} code. Check for: bugs, security issues, performance problems, naming, code smells, and best practices. Give specific, actionable feedback.',
    },
    {
      id: 'optimize', name: 'Optimize Performance', category: 'Quality',
      includeEditorContext: true,
      template: 'Identify and fix performance bottlenecks in this {{language}} code. Explain the issues and provide an optimized version with before/after comparison.',
    },
    {
      id: 'debug', name: 'Debug Help', category: 'Debug',
      includeEditorContext: true,
      includeDebugContext: true,
      template: 'I am debugging a {{language}} issue.\n\nProblem description: {{problem}}\n\nHelp me diagnose the root cause, suggest debugging strategies, and provide potential fixes.',
    },
    {
      id: 'docs', name: 'Add Documentation', category: 'Quality',
      includeEditorContext: true,
      template: 'Add comprehensive JSDoc/docstring comments and inline documentation to this {{language}} code. Follow the standard documentation conventions for {{language}}.',
    },
    {
      id: 'selenium', name: 'Selenium Test (BDD)', category: 'Testing',
      includeEditorContext: true,
      template: 'Write a Selenium WebDriver test for this {{language}} code using BDD/Cucumber framework. Include step definitions, feature file, and page object pattern.',
    },
    {
      id: 'custom', name: 'Custom Prompt', category: 'General',
      includeEditorContext: false,
      template: '{{prompt}}',
    },
  ].map(c => ({ ...c, createdAt: now, updatedAt: now }));
}

// ── Activate ──────────────────────────────────────────────────────────────────

function activate(context) {
  const stateKey = 'bridge.commands.v2';
  let cmds = context.globalState.get(stateKey, getDefaults());

  // ── HTTP server ─────────────────────────────────────────────────────────────
  const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const { pathname } = url.parse(req.url);

    try {

      // ────── Serve web app ──────────────────────────────────────────────────
      if (pathname === '/' || pathname === '/index.html') {
        const html = fs.readFileSync(
          path.join(context.extensionPath, 'web', 'index.html'), 'utf8'
        );
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        });
        res.end(html);
        return;
      }

      // ────── Health / available models ─────────────────────────────────────
      if (pathname === '/health') {
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' }).catch(() => []);
        jsonReply(res, {
          ok: true,
          vscodeVersion: vscode.version,
          models: models.map(m => ({
            id: m.id, name: m.name, family: m.family,
            maxInputTokens: m.maxInputTokens,
          })),
        });
        return;
      }

      // ────── VS Code editor + debug context ───────────────────────────────
      if (pathname === '/context') {
        const ed  = vscode.window.activeTextEditor;
        const dbg = vscode.debug.activeDebugSession;
        const diag = ed
          ? vscode.languages.getDiagnostics(ed.document.uri)
              .slice(0, 5)
              .map(d => ({ msg: d.message.substring(0, 80), line: d.range.start.line + 1, sev: d.severity }))
          : [];

        jsonReply(res, {
          editor: ed ? {
            fileName:       path.basename(ed.document.fileName),
            filePath:       ed.document.fileName,
            language:       ed.document.languageId,
            lineCount:      ed.document.lineCount,
            selection:      ed.document.getText(ed.selection) || null,
            selectionRange: ed.selection.isEmpty
              ? null
              : `L${ed.selection.start.line + 1}–L${ed.selection.end.line + 1}`,
            cursorLine:     ed.selection.active.line + 1,
            isDirty:        ed.document.isDirty,
          } : null,
          debug: dbg ? { name: dbg.name, type: dbg.type, id: dbg.id } : null,
          diagnostics: diag,
        });
        return;
      }

      // ────── Commands — list ───────────────────────────────────────────────
      if (pathname === '/commands' && req.method === 'GET') {
        jsonReply(res, cmds);
        return;
      }

      // ────── Commands — save / create ──────────────────────────────────────
      if (pathname === '/commands' && req.method === 'POST') {
        const payload = parseJsonSafe(await readBody(req));
        if (!payload || typeof payload !== 'object') {
          jsonReply(res, { ok: false, error: 'Invalid JSON payload' }, 400);
          return;
        }
        const cmd = sanitizeCommand(payload);
        cmds = [...cmds.filter(c => c.id !== cmd.id), cmd];
        await context.globalState.update(stateKey, cmds);
        jsonReply(res, cmd);
        return;
      }

      // ────── Commands — delete ─────────────────────────────────────────────
      if (pathname.startsWith('/commands/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        cmds = cmds.filter(c => c.id !== id);
        await context.globalState.update(stateKey, cmds);
        jsonReply(res, { ok: true });
        return;
      }

      // ────── Commands — reset to defaults ─────────────────────────────────
      if (pathname === '/commands/reset' && req.method === 'POST') {
        cmds = getDefaults();
        await context.globalState.update(stateKey, cmds);
        jsonReply(res, cmds);
        return;
      }

      // ────── Chat → SSE streaming via vscode.lm ────────────────────────────
      if (pathname === '/chat' && req.method === 'POST') {
        const body = parseJsonSafe(await readBody(req));
        if (!body || typeof body !== 'object') {
          jsonReply(res, { ok: false, error: 'Invalid JSON payload' }, 400);
          return;
        }
        const {
          prompt,
          includeEditorContext = true,
          includeDebugContext  = false,
          includeDiagnostics   = false,
          openInPanel          = false,
          modelFamily,
        } = body;

        if (typeof prompt !== 'string' || !prompt.trim()) {
          jsonReply(res, { ok: false, error: 'Prompt is required' }, 400);
          return;
        }

        // SSE response headers
        res.writeHead(200, {
          'Content-Type':  'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection':    'keep-alive',
        });

        const emit = data => res.write(`data: ${JSON.stringify(data)}\n\n`);

        try {
          const ed  = vscode.window.activeTextEditor;
          const dbg = vscode.debug.activeDebugSession;

          // Build full prompt
          let fullPrompt = prompt;

          if (includeEditorContext && ed) {
            const sel  = ed.document.getText(ed.selection);
            const code = sel || ed.document.getText().substring(0, 14000);
            const lang = ed.document.languageId;
            const file = path.basename(ed.document.fileName);
            fullPrompt =
              `File: ${file}  |  Language: ${lang}\n\n` +
              `\`\`\`${lang}\n${code}\n\`\`\`\n\n---\n\n${prompt}`;
          }

          if (includeDebugContext && dbg) {
            fullPrompt = `[Active Debug Session: ${dbg.name} (${dbg.type})]\n\n${fullPrompt}`;
          }

          // Include diagnostics if any
          if (includeEditorContext && includeDiagnostics && ed) {
            const diag = vscode.languages.getDiagnostics(ed.document.uri).slice(0, 5);
            if (diag.length) {
              const diagStr = diag.map(d => `  L${d.range.start.line + 1}: ${d.message}`).join('\n');
              fullPrompt += `\n\n[VS Code Diagnostics / Errors]\n${diagStr}`;
            }
          }

          // Select Copilot model
          const filter = { vendor: 'copilot' };
          if (modelFamily) filter.family = modelFamily;
          const models = await vscode.lm.selectChatModels(filter);

          if (!models.length) {
            emit({
              type: 'error',
              message:
                'No Copilot model available. Make sure GitHub Copilot is installed and you are signed in to VS Code.',
            });
            res.end();
            return;
          }

          const model = models[0];
          emit({ type: 'model', name: model.name, family: model.family });

          // Optionally open Chat panel in parallel
          if (openInPanel) {
            vscode.commands.executeCommand('workbench.action.chat.open').catch(() => {});
          }

          // Cancel if client disconnects
          const cts = new vscode.CancellationTokenSource();
          req.on('close', () => cts.cancel());

          // Stream Copilot response
          emit({ type: 'start' });
          const response = await model.sendRequest(
            [vscode.LanguageModelChatMessage.User(fullPrompt)],
            {},
            cts.token
          );

          for await (const chunk of response.text) {
            emit({ type: 'chunk', text: chunk });
          }

          emit({ type: 'end' });

        } catch (err) {
          emit({ type: 'error', message: err.message || String(err) });
        }

        res.end();
        return;
      }

      res.writeHead(404);
      res.end('Not found');

    } catch (err) {
      console.error('[Copilot Bridge]', err);
      if (!res.headersSent) { res.writeHead(500); res.end(err.message); }
    }
  });

  server.listen(PORT, 'localhost', () => {
    console.log(`[Copilot Bridge] running at http://localhost:${PORT}`);
  });

  // Status bar item
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  bar.text    = '$(sparkle) Bridge';
  bar.tooltip = 'Copilot Bridge — click to open web UI';
  bar.command = 'copilotBridge.openUI';
  bar.show();

  // Commands
  const open = vscode.commands.registerCommand('copilotBridge.openUI', () => {
    vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${PORT}`));
  });

  const reset = vscode.commands.registerCommand('copilotBridge.resetCommands', async () => {
    cmds = getDefaults();
    await context.globalState.update(stateKey, cmds);
    vscode.window.showInformationMessage('Copilot Bridge: commands reset to defaults.');
  });

  context.subscriptions.push(open, reset, bar, { dispose: () => server.close() });

  // Greet on activation
  vscode.window.showInformationMessage(
    `Copilot Bridge active on port ${PORT}`, 'Open UI'
  ).then(pick => {
    if (pick === 'Open UI') {
      vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${PORT}`));
    }
  });
}

function deactivate() {}

module.exports = { activate, deactivate };