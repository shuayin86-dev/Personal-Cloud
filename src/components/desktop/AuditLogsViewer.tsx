import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Search,
  LogOut,
  LogIn,
  Shield,
  File,
  Zap,
  AlertCircle,
  FileText,
  Lock,
  Eye,
} from 'lucide-react';
import {
  auditLoggingService,
  type AuditLogEntry,
  type AuditAction,
  type AuditResourceType,
} from '@/lib/audit-logging';

interface AuditLogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  mfa_setup: <Shield className="w-4 h-4" />,
  file_upload: <File className="w-4 h-4" />,
  file_download: <Download className="w-4 h-4" />,
  ai_query: <Zap className="w-4 h-4" />,
  security_alert: <AlertCircle className="w-4 h-4" />,
  export_data: <Download className="w-4 h-4" />,
  settings_change: <FileText className="w-4 h-4" />,
  encryption_key_change: <Lock className="w-4 h-4" />,
};

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadLogs = () => {
      const allLogs = auditLoggingService.getAllLogs?.() || [];
      setLogs(allLogs);
      applyFilters(allLogs);

      const logStats = auditLoggingService.getStats?.();
      setStats(logStats);
    };

    loadLogs();
    const interval = setInterval(loadLogs, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    applyFilters(logs);
  }, [searchTerm, selectedAction, selectedSeverity, selectedResourceType, logs]);

  const applyFilters = (logsToFilter: AuditLogEntry[]) => {
    let filtered = logsToFilter;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ipAddress?.includes(searchTerm)
      );
    }

    if (selectedAction !== 'all') {
      filtered = filtered.filter((log) => log.action === selectedAction);
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter((log) => log.severity === selectedSeverity);
    }

    if (selectedResourceType !== 'all') {
      filtered = filtered.filter((log) => log.resourceType === selectedResourceType);
    }

    setFilteredLogs(filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleExport = (format: 'json' | 'csv') => {
    const exported = auditLoggingService.exportLogs?.(filteredLogs, format);
    if (!exported) return;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(exported)}`);
    element.setAttribute('download', `audit-logs.${format}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getUniqueActions = (logsData: AuditLogEntry[]) => {
    return Array.from(new Set(logsData.map((log) => log.action)));
  };

  const getUniqueSeverities = (logsData: AuditLogEntry[]) => {
    return Array.from(new Set(logsData.map((log) => log.severity)));
  };

  const getUniqueResourceTypes = (logsData: AuditLogEntry[]) => {
    return Array.from(new Set(logsData.map((log) => log.resourceType)));
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 ${isOpen ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto ml-auto mr-4 mt-4 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <p className="text-purple-100">System Activity & Security Events</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-purple-700"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalEvents || 0}</p>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Critical Events</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {stats.eventsBySeverity?.critical || 0}
                </p>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Failed Logins</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">
                  {stats.failedLoginAttempts || 0}
                </p>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Unique Users</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{stats.uniqueUsers || 0}</p>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by user ID, IP, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <Button
                  onClick={() => handleExport('json')}
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                >
                  Export JSON
                </Button>
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                >
                  Export CSV
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Actions</SelectItem>
                    {getUniqueActions(logs).map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Severities</SelectItem>
                    {getUniqueSeverities(logs).map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Resources</SelectItem>
                    {getUniqueResourceTypes(logs).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Logs Table */}
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                  {filteredLogs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="hover:bg-gray-750">
                      <td className="px-6 py-3 text-sm text-gray-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300 font-mono">
                        {log.userId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300 flex items-center gap-2">
                        {ACTION_ICONS[log.action as keyof typeof ACTION_ICONS]}
                        {log.action}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300">{log.resourceType}</td>
                      <td className="px-6 py-3 text-sm">
                        <Badge className={SEVERITY_COLORS[log.severity]}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400 font-mono">
                        {log.ipAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                No logs found matching your filters
              </div>
            )}
            {filteredLogs.length > 50 && (
              <div className="p-4 bg-gray-900 text-center text-gray-400 text-sm border-t border-gray-700">
                Showing 50 of {filteredLogs.length} logs
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsViewer;
