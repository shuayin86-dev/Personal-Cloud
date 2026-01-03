import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  Zap,
  Code2,
  Lightbulb,
  BarChart3,
  Bug,
  RefreshCw,
  Copy,
  CheckCircle,
  Copy as CopyIcon,
} from 'lucide-react';
import {
  aiCodeEditorService,
  type CodeSuggestion,
  type CodeIssue,
  type ProgrammingLanguage,
} from '@/lib/ai-code-editor';

interface AICodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_LANGUAGES: ProgrammingLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
];

export const AICodeEditorModal: React.FC<AICodeEditorModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('// Enter your code here\nfunction example() {\n  console.log("Hello, World!");\n}');
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CodeSuggestion | null>(null);
  const [refactoringSuggestions, setRefactoringSuggestions] = useState<any[]>([]);
  const [breakpoints, setBreakpoints] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      analyzeCode();
    }
  }, [isOpen, code, language]);

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      // Get suggestions
      const lineSuggestions = aiCodeEditorService.getCodeSuggestions(code, language, 0, 0);
      setSuggestions(lineSuggestions);

      // Get issues
      const codeIssues = aiCodeEditorService.analyzeCode(code, language);
      setIssues(codeIssues);

      // Get metrics
      const codeMetrics = aiCodeEditorService.analyzeCodeMetrics(code, language);
      setMetrics(codeMetrics);

      // Get refactoring suggestions
      const refactoring = aiCodeEditorService.suggestRefactoring(code, language);
      setRefactoringSuggestions(refactoring);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion: CodeSuggestion) => {
    setSelectedSuggestion(suggestion);
    const newCode = aiCodeEditorService.generateFixedCode(code, suggestion.description, language);
    setCode(newCode);
    setSelectedSuggestion(null);
  };

  const addBreakpoint = (line: number) => {
    const bp = aiCodeEditorService.addBreakpoint('editor.ts', line, '');
    setBreakpoints([...breakpoints, bp]);
  };

  const removeBreakpoint = (bpId: string) => {
    aiCodeEditorService.removeBreakpoint('editor.ts', bpId);
    setBreakpoints(breakpoints.filter((bp) => bp.id !== bpId));
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Code2 className="w-6 h-6 text-blue-500" />
            AI Code Editor & Analyzer
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 h-[70vh]">
          {/* Code Editor */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-300">Language:</label>
              <Select value={language} onValueChange={(val) => setLanguage(val as ProgrammingLanguage)}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang} className="text-white">
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code here..."
              className="bg-gray-800 border-gray-700 text-white font-mono text-xs resize-none flex-1"
            />
          </div>

          {/* Analysis Results */}
          <div className="flex flex-col gap-2 overflow-y-auto">
            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="bg-gray-800 border-b border-gray-700 w-full">
                <TabsTrigger value="suggestions" className="text-xs">
                  Suggestions ({suggestions.length})
                </TabsTrigger>
                <TabsTrigger value="issues" className="text-xs">
                  Issues ({issues.length})
                </TabsTrigger>
                <TabsTrigger value="metrics" className="text-xs">
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="refactor" className="text-xs">
                  Refactor
                </TabsTrigger>
              </TabsList>

              {/* Suggestions */}
              <TabsContent value="suggestions" className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <p className="text-gray-400 text-sm p-2">No suggestions available</p>
                ) : (
                  suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="bg-gray-800 border-gray-700 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{suggestion.type}</p>
                          <p className="text-gray-400 text-xs mt-1">{suggestion.description}</p>
                          {suggestion.example && (
                            <p className="text-purple-400 text-xs mt-1 font-mono">
                              Example: {suggestion.example}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="bg-purple-600 hover:bg-purple-700 text-xs flex-shrink-0"
                        >
                          <Lightbulb className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Issues */}
              <TabsContent value="issues" className="space-y-2 max-h-96 overflow-y-auto">
                {issues.length === 0 ? (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-green-800 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      No issues detected!
                    </p>
                  </div>
                ) : (
                  issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-sm ${getIssueColor(issue.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold">{issue.type}: {issue.message}</p>
                          <p className="text-xs opacity-75 mt-1">Line {issue.line}</p>
                          {issue.suggestion && (
                            <p className="text-xs opacity-75 mt-1 italic">
                              Suggestion: {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Metrics */}
              <TabsContent value="metrics" className="space-y-2 max-h-96 overflow-y-auto">
                {metrics ? (
                  <div className="space-y-2">
                    <Card className="bg-gray-800 border-gray-700 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Lines of Code</span>
                        <span className="text-white font-bold text-lg">{metrics.lines}</span>
                      </div>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Cyclomatic Complexity</span>
                        <span
                          className={`font-bold text-lg ${
                            metrics.complexity <= 5
                              ? 'text-green-400'
                              : metrics.complexity <= 10
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {metrics.complexity}
                        </span>
                      </div>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Code Duplication</span>
                        <span
                          className={`font-bold text-lg ${
                            metrics.duplication <= 10
                              ? 'text-green-400'
                              : metrics.duplication <= 25
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {metrics.duplication}%
                        </span>
                      </div>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Maintainability Index</span>
                        <span
                          className={`font-bold text-lg ${
                            metrics.maintainability >= 80
                              ? 'text-green-400'
                              : metrics.maintainability >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {metrics.maintainability}/100
                        </span>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm p-2">Analyze code to see metrics</p>
                )}
              </TabsContent>

              {/* Refactoring */}
              <TabsContent value="refactor" className="space-y-2 max-h-96 overflow-y-auto">
                {refactoringSuggestions.length === 0 ? (
                  <p className="text-gray-400 text-sm p-2">No refactoring suggestions</p>
                ) : (
                  refactoringSuggestions.map((suggestion, idx) => (
                    <Card key={idx} className="bg-gray-800 border-gray-700 p-2">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{suggestion.title}</p>
                          <p className="text-gray-400 text-xs mt-1">{suggestion.description}</p>
                          {suggestion.changes && suggestion.changes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {suggestion.changes.map((change: any, changeIdx: number) => (
                                <div key={changeIdx} className="flex items-center justify-between gap-1">
                                  <code className="bg-gray-900 px-2 py-1 rounded text-xs text-purple-300 flex-1 overflow-hidden text-ellipsis">
                                    {change.newCode}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(change.newCode, changeIdx)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {copiedIndex === changeIdx ? (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <CopyIcon className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AICodeEditorModal;
