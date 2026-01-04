import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Wifi,
  BarChart3,
  AlertCircle,
  TrendingDown,
  Network,
} from 'lucide-react';
import {
  threatDetectionService,
  type ThreatIndicator,
} from '@/lib/threat-detection';

interface ThreatDetectionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const THREAT_TYPE_COLORS: Record<string, string> = {
  ddos: '#ef4444',
  port_scan: '#f97316',
  sql_injection: '#eab308',
  xss: '#84cc16',
  data_exfiltration: '#06b6d4',
  unauthorized_access: '#8b5cf6',
  malware: '#d946ef',
  brute_force: '#ec4899',
  privilege_escalation: '#f43f5e',
  zero_day: '#be123c',
};

const THREAT_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const ThreatDetectionDashboard: React.FC<ThreatDetectionDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [allThreats, setAllThreats] = useState<ThreatIndicator[]>([]);
  const [criticalThreats, setCriticalThreats] = useState<ThreatIndicator[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [threatTypeData, setThreatTypeData] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadThreatData = () => {
      const threats = threatDetectionService.getThreats?.();
      const critical = threatDetectionService.getCriticalThreats?.();
      const threatStats = threatDetectionService.getStats?.();

      setAllThreats(threats || []);
      setCriticalThreats(critical || []);
      setStats(threatStats);

      // Build threat type chart data
      if (threatStats?.threatsByType) {
        const chartData = Object.entries(threatStats.threatsByType).map(([type, count]) => ({
          name: type.replace(/_/g, ' '),
          value: count,
          fill: THREAT_TYPE_COLORS[type] || '#6366f1',
        }));
        setThreatTypeData(chartData);
      }
    };

    loadThreatData();
    const interval = setInterval(loadThreatData, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleResolveThreat = (threatId: string) => {
    threatDetectionService.resolveThreat?.(threatId, 'admin_action');
    // Reload threats
    const threats = threatDetectionService.getThreats?.();
    setAllThreats(threats || []);
  };

  const activeThreatCount = allThreats.filter((t) => !t.resolved).length;
  const threatLevel =
    criticalThreats.length > 0 ? 'critical' : activeThreatCount > 10 ? 'high' : 'medium';

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
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Threat Detection</h1>
                <p className="text-red-100">Network Security Monitoring</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-red-700"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Critical Alerts */}
          {criticalThreats.length > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-semibold mb-2">Critical Threats Detected!</p>
                <ul className="space-y-1 text-sm">
                  {criticalThreats.slice(0, 3).map((threat, i) => (
                    <li key={i}>
                      • {threat.type}: {threat.description} (Severity: {threat.severity})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className={`bg-gradient-to-br from-${threatLevel === 'critical' ? 'red' : 'green'}-900 to-${threatLevel === 'critical' ? 'red' : 'green'}-800 border-${threatLevel === 'critical' ? 'red' : 'green'}-700 p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${threatLevel === 'critical' ? 'text-red-100' : 'text-green-100'} text-sm`}>
                    Threat Level
                  </p>
                  <p className={`text-4xl font-bold ${threatLevel === 'critical' ? 'text-red-300' : 'text-green-300'} mt-2 uppercase`}>
                    {threatLevel}
                  </p>
                </div>
                <AlertTriangle className={`w-12 h-12 ${threatLevel === 'critical' ? 'text-red-400' : 'text-green-400'} opacity-50`} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Active Threats</p>
                  <p className="text-4xl font-bold text-orange-300 mt-2">{activeThreatCount}</p>
                </div>
                <Network className="w-12 h-12 text-orange-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Resolved</p>
                  <p className="text-4xl font-bold text-purple-300 mt-2">
                    {allThreats.filter((t) => t.resolved).length}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-purple-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Threat Types</p>
                  <p className="text-4xl font-bold text-blue-300 mt-2">
                    {Object.keys(stats?.threatsByType || {}).length}
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            {/* Threat Types Pie Chart */}
            {threatTypeData.length > 0 && (
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Threats by Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={threatTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {threatTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Threat Severity Distribution */}
            {stats?.threatsBySeverity && (
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Severity Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={Object.entries(stats.threatsBySeverity).map(([severity, count]) => ({
                      severity,
                      count,
                    }))}
                  >
                    <CartesianGrid stroke="#374151" />
                    <XAxis stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Active Threats Table */}
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Active Threats
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Detected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allThreats.filter((t) => !t.resolved).map((threat, i) => (
                    <tr key={i} className="hover:bg-gray-750">
                      <td className="px-6 py-3 text-sm text-gray-300 font-medium">
                        {threat.type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400">{threat.description}</td>
                      <td className="px-6 py-3 text-sm">
                        <Badge className={THREAT_LEVEL_COLORS[threat.severity]}>
                          {threat.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400">
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                          Active
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Button
                          size="sm"
                          onClick={() => handleResolveThreat(threat.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allThreats.filter((t) => !t.resolved).length === 0 && (
                <div className="p-6 text-center text-gray-400">
                  No active threats detected
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThreatDetectionDashboard;
