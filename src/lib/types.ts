// File information types
export interface FileInfo {
  name: string;
  size?: number;
  uploadedAt: Date;
  type: string;
  content?: Uint8Array;
}

// File analysis results from AI organizer
export interface FileAnalysis {
  category: string;
  tags: string[];
  confidence: number;
  isSensitive: boolean;
}

// File version information
export interface FileVersion {
  id: string;
  hash: string;
  author: string;
  timestamp: Date;
  message: string;
  changeType: 'created' | 'modified' | 'restored';
}

// Version history
export interface VersionHistory {
  fileId: string;
  versions: FileVersion[];
  totalVersions: number;
}

// Version diff information
export interface VersionDiff {
  versionIdA: string;
  versionIdB: string;
  additions: number;
  deletions: number;
  changes: string[];
}

// Encryption metadata
export interface EncryptionMetadata {
  algorithm: string;
  keyDerivation: string;
  salt?: string;
  iv?: string;
  iterations?: number;
}

// File categorization options
export type FileCategory = 
  | 'images'
  | 'documents'
  | 'code'
  | 'media'
  | 'archive'
  | 'data'
  | 'other';

// Penetration Testing Types
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanType = 'port-scan' | 'vulnerability-scan' | 'web-scan' | 'network-scan' | 'compliance-check';
export type AttackType = 'dos' | 'social-engineering' | 'phishing' | 'brute-force' | 'injection';

// Code Editor Types
export type ProgrammingLanguage = 
  | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' 
  | 'go' | 'rust' | 'php' | 'ruby' | 'swift' | 'kotlin' | 'sql' | 'html' | 'css';
