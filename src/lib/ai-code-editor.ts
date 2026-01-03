// AI-Powered Code Editor Service
// Provides code completion, suggestions, syntax highlighting, and debugging features

export type ProgrammingLanguage = 
  | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' 
  | 'go' | 'rust' | 'php' | 'ruby' | 'swift' | 'kotlin' | 'sql' | 'html' | 'css';

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactoring' | 'bug-fix' | 'optimization';
  title: string;
  description: string;
  suggestedCode: string;
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  line: number;
  column: number;
  originalCode: string;
  reasoning: string;
}

export interface SyntaxHighlightRule {
  language: ProgrammingLanguage;
  patterns: Map<string, string>; // regex pattern -> color/style
  keywords: string[];
  builtins: string[];
  comments: { single: string; multi: { start: string; end: string } };
}

export interface DebugBreakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  enabled: boolean;
}

export interface VariableValue {
  name: string;
  value: string;
  type: string;
  scope: 'local' | 'global' | 'parameter';
}

export interface DebugStack {
  frames: StackFrame[];
  currentFrame: number;
}

export interface StackFrame {
  functionName: string;
  file: string;
  line: number;
  variables: VariableValue[];
}

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  line: number;
  column: number;
  suggestion?: string;
  severity: number; // 1-10
}

export interface RefactoringOption {
  id: string;
  name: string;
  description: string;
  changes: CodeChange[];
  impact: 'low' | 'medium' | 'high';
}

export interface CodeChange {
  type: 'insert' | 'delete' | 'replace';
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
  newContent?: string;
}

export interface CodeMetrics {
  lines: number;
  complexity: number; // cyclomatic complexity
  duplication: number; // percentage
  maintainability: number; // 0-100
  testCoverage?: number; // percentage
  issues: CodeIssue[];
}

export class AICodeEditorService {
  private syntaxHighlightRules = new Map<ProgrammingLanguage, SyntaxHighlightRule>();
  private breakpoints = new Map<string, DebugBreakpoint[]>();
  private debugStack: DebugStack | null = null;
  private codeAnalysisCache = new Map<string, CodeMetrics>();

  constructor() {
    this.initializeSyntaxHighlighting();
  }

  /**
   * Initialize syntax highlighting rules for all languages
   */
  private initializeSyntaxHighlighting(): void {
    const jsRules: SyntaxHighlightRule = {
      language: 'javascript',
      patterns: new Map([
        ['string', '#3fb950'],
        ['number', '#79c0ff'],
        ['boolean', '#ff7b72'],
        ['function', '#d2a8ff'],
        ['class', '#ffa657'],
        ['comment', '#8b949e'],
      ]),
      keywords: [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
        'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
      ],
      builtins: [
        'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
        'Object', 'Promise', 'RegExp', 'String', 'Symbol', 'WeakMap', 'WeakSet',
        'console', 'global', 'process', 'Buffer',
      ],
      comments: {
        single: '//',
        multi: { start: '/*', end: '*/' },
      },
    };

    const pythonRules: SyntaxHighlightRule = {
      language: 'python',
      patterns: new Map([
        ['string', '#3fb950'],
        ['number', '#79c0ff'],
        ['boolean', '#ff7b72'],
        ['function', '#d2a8ff'],
        ['class', '#ffa657'],
        ['comment', '#8b949e'],
      ]),
      keywords: [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
        'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global',
        'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass',
        'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
      ],
      builtins: [
        'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'chr', 'classmethod',
        'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval',
        'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr',
        'hash', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
        'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct',
        'open', 'ord', 'pow', 'print', 'property', 'range', 'repr', 'reversed', 'round',
        'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super',
        'tuple', 'type', 'vars', 'zip',
      ],
      comments: {
        single: '#',
        multi: { start: '"""', end: '"""' },
      },
    };

    this.syntaxHighlightRules.set('javascript', jsRules);
    this.syntaxHighlightRules.set('python', pythonRules);
  }

  /**
   * Get AI-powered code suggestions
   */
  async getCodeSuggestions(
    code: string,
    language: ProgrammingLanguage,
    line: number,
    column: number
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Analyze code for common issues
    const issues = this.analyzeCode(code, language);

    // Generate suggestions based on analysis
    issues.forEach((issue) => {
      if (issue.type === 'error' && issue.line === line) {
        suggestions.push({
          id: `suggestion-${Date.now()}`,
          type: 'bug-fix',
          title: 'Fix: ' + issue.message,
          description: issue.suggestion || issue.message,
          suggestedCode: this.generateFixedCode(code, issue, language),
          severity: 'error',
          line: issue.line,
          column: issue.column,
          originalCode: code.split('\n')[issue.line - 1] || '',
          reasoning: issue.suggestion || 'This will fix the reported issue.',
        });
      }
    });

    // Add code completion suggestions
    const completions = this.generateCodeCompletion(language, code, line, column);
    suggestions.push(...completions);

    return suggestions;
  }

  /**
   * Generate code completion suggestions
   */
  private generateCodeCompletion(
    language: ProgrammingLanguage,
    code: string,
    line: number,
    column: number
  ): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const rules = this.syntaxHighlightRules.get(language);

    if (!rules) return suggestions;

    const currentLine = code.split('\n')[line - 1] || '';
    const prefix = currentLine.substring(0, column);

    // Extract the partial word being typed
    const match = prefix.match(/\w+$/);
    const partialWord = match ? match[0] : '';

    if (partialWord.length === 0) return suggestions;

    // Find matching keywords
    const matchedKeywords = rules.keywords.filter((k) => k.startsWith(partialWord));
    const matchedBuiltins = rules.builtins.filter((b) => b.startsWith(partialWord));

    matchedKeywords.forEach((keyword) => {
      suggestions.push({
        id: `completion-${keyword}`,
        type: 'completion',
        title: keyword,
        description: `Insert keyword: ${keyword}`,
        suggestedCode: keyword,
        severity: 'info',
        line,
        column,
        originalCode: partialWord,
        reasoning: 'Auto-completion suggestion based on keywords.',
      });
    });

    matchedBuiltins.forEach((builtin) => {
      suggestions.push({
        id: `completion-${builtin}`,
        type: 'completion',
        title: builtin,
        description: `Insert built-in: ${builtin}`,
        suggestedCode: builtin,
        severity: 'info',
        line,
        column,
        originalCode: partialWord,
        reasoning: 'Auto-completion suggestion based on built-in functions/objects.',
      });
    });

    return suggestions;
  }

  /**
   * Analyze code for issues
   */
  analyzeCode(code: string, language: ProgrammingLanguage): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for common issues based on language
      if (language === 'javascript' || language === 'typescript') {
        // Check for missing semicolons
        if (line.match(/\w\)$/) && !line.trim().startsWith('//')) {
          issues.push({
            id: `issue-${lineNum}-1`,
            type: 'warning',
            message: 'Missing semicolon',
            line: lineNum,
            column: line.length,
            suggestion: 'Add semicolon at end of line',
            severity: 5,
          });
        }

        // Check for unused variables
        if (line.match(/const\s+\w+\s*=/)) {
          const varMatch = line.match(/const\s+(\w+)/);
          if (varMatch && !code.includes(varMatch[1])) {
            issues.push({
              id: `issue-${lineNum}-2`,
              type: 'warning',
              message: `Variable '${varMatch[1]}' is declared but never used`,
              line: lineNum,
              column: line.indexOf(varMatch[0]) + varMatch[0].length,
              suggestion: 'Remove unused variable',
              severity: 4,
            });
          }
        }

        // Check for console.log in production code
        if (line.includes('console.log')) {
          issues.push({
            id: `issue-${lineNum}-3`,
            type: 'info',
            message: 'console.log statement found',
            line: lineNum,
            column: line.indexOf('console.log'),
            suggestion: 'Consider removing console.log for production',
            severity: 2,
          });
        }
      }

      if (language === 'python') {
        // Check for missing colons
        if (line.match(/^(if|elif|else|for|while|def|class)\s+.*[^:]$/) && !line.trim().startsWith('#')) {
          issues.push({
            id: `issue-${lineNum}-1`,
            type: 'error',
            message: 'Missing colon',
            line: lineNum,
            column: line.length,
            suggestion: 'Add colon at end of line',
            severity: 10,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Generate fixed code based on issue
   */
  private generateFixedCode(code: string, issue: CodeIssue, language: ProgrammingLanguage): string {
    const lines = code.split('\n');
    const line = lines[issue.line - 1];

    if (!line) return code;

    if (issue.message.includes('Missing semicolon')) {
      lines[issue.line - 1] = line.trimEnd() + ';';
    } else if (issue.message.includes('Missing colon')) {
      lines[issue.line - 1] = line.trimEnd() + ':';
    }

    return lines.join('\n');
  }

  /**
   * Get syntax highlighting rules
   */
  getSyntaxHighlighting(language: ProgrammingLanguage): SyntaxHighlightRule | null {
    return this.syntaxHighlightRules.get(language) || null;
  }

  /**
   * Analyze code complexity and metrics
   */
  analyzeCodeMetrics(code: string, language: ProgrammingLanguage): CodeMetrics {
    const cached = this.codeAnalysisCache.get(code);
    if (cached) return cached;

    const lines = code.split('\n').length;
    const complexity = this.calculateCyclomaticComplexity(code);
    const duplication = this.calculateCodeDuplication(code);
    const issues = this.analyzeCode(code, language);
    const maintainability = Math.max(0, 100 - issues.length * 5 - complexity * 2);

    const metrics: CodeMetrics = {
      lines,
      complexity,
      duplication,
      maintainability: Math.min(100, maintainability),
      issues,
    };

    this.codeAnalysisCache.set(code, metrics);
    return metrics;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1;

    // Count decision points
    const conditions = (code.match(/if\s|else\s|for\s|while\s|case\s|catch\s/g) || []).length;
    const logicalOps = (code.match(/&&|\|\|/g) || []).length;
    const ternary = (code.match(/\?.*:/g) || []).length;

    complexity += conditions + Math.floor(logicalOps / 2) + ternary;

    return complexity;
  }

  /**
   * Calculate code duplication percentage
   */
  private calculateCodeDuplication(code: string): number {
    const lines = code.split('\n');
    const uniqueLines = new Set(lines);

    return Math.round(((lines.length - uniqueLines.size) / lines.length) * 100);
  }

  /**
   * Suggest refactoring options
   */
  suggestRefactoring(code: string, language: ProgrammingLanguage): RefactoringOption[] {
    const options: RefactoringOption[] = [];
    const metrics = this.analyzeCodeMetrics(code, language);

    // High complexity refactoring
    if (metrics.complexity > 10) {
      options.push({
        id: 'refactor-extract-functions',
        name: 'Extract Functions',
        description: 'Break down complex functions into smaller, focused functions',
        changes: [
          {
            type: 'replace',
            startLine: 1,
            endLine: metrics.lines,
            newContent: code, // Would be replaced with actual refactoring
          },
        ],
        impact: 'high',
      });
    }

    // High duplication refactoring
    if (metrics.duplication > 15) {
      options.push({
        id: 'refactor-remove-duplication',
        name: 'Remove Code Duplication',
        description: 'Extract common code into shared functions or utilities',
        changes: [
          {
            type: 'replace',
            startLine: 1,
            endLine: metrics.lines,
            newContent: code,
          },
        ],
        impact: 'medium',
      });
    }

    // Many issues refactoring
    if (metrics.issues.length > 5) {
      options.push({
        id: 'refactor-code-cleanup',
        name: 'Code Cleanup',
        description: 'Fix all identified issues and improve code quality',
        changes: [
          {
            type: 'replace',
            startLine: 1,
            endLine: metrics.lines,
            newContent: code,
          },
        ],
        impact: 'medium',
      });
    }

    return options;
  }

  /**
   * Add debug breakpoint
   */
  addBreakpoint(file: string, line: number, condition?: string): DebugBreakpoint {
    const breakpoint: DebugBreakpoint = {
      id: `bp-${Date.now()}`,
      file,
      line,
      condition,
      enabled: true,
    };

    if (!this.breakpoints.has(file)) {
      this.breakpoints.set(file, []);
    }

    this.breakpoints.get(file)!.push(breakpoint);
    return breakpoint;
  }

  /**
   * Get breakpoints for file
   */
  getBreakpoints(file: string): DebugBreakpoint[] {
    return this.breakpoints.get(file) || [];
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(file: string, breakpointId: string): void {
    const bps = this.breakpoints.get(file);
    if (bps) {
      const index = bps.findIndex((bp) => bp.id === breakpointId);
      if (index > -1) {
        bps.splice(index, 1);
      }
    }
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(file: string, breakpointId: string): void {
    const bps = this.breakpoints.get(file);
    if (bps) {
      const bp = bps.find((b) => b.id === breakpointId);
      if (bp) {
        bp.enabled = !bp.enabled;
      }
    }
  }

  /**
   * Simulate debug stepping
   */
  getDebugStack(): DebugStack | null {
    // Simulated debug stack
    if (!this.debugStack) {
      this.debugStack = {
        frames: [
          {
            functionName: 'main',
            file: 'app.js',
            line: 42,
            variables: [
              { name: 'count', value: '5', type: 'number', scope: 'local' },
              { name: 'name', value: '"John"', type: 'string', scope: 'local' },
              { name: 'global', value: '{}', type: 'object', scope: 'global' },
            ],
          },
          {
            functionName: 'processData',
            file: 'utils.js',
            line: 15,
            variables: [
              { name: 'data', value: '[1,2,3,4,5]', type: 'array', scope: 'parameter' },
            ],
          },
        ],
        currentFrame: 0,
      };
    }

    return this.debugStack;
  }

  /**
   * Clear code analysis cache
   */
  clearCache(): void {
    this.codeAnalysisCache.clear();
  }
}

export const aiCodeEditorService = new AICodeEditorService();
