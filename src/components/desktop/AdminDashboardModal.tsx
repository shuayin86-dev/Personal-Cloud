import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
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
  Activity,
  Users,
  AlertTriangle,
  Zap,
  HardDrive,
  Wifi,
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
} from 'lucide-react';
import { adminDashboardService, type SystemMetrics, type ResourceAlert, type UserSessionInfo } from '@/lib/admin-dashboard';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALERT_COLORS: Record<string, string> = {
  warning: 'bg-yellow-50 border-yellow-200',
  critical: 'bg-red-50 border-red-200',
};

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSessionInfo[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<ResourceAlert[]>([]);
  const [allAlerts, setAllAlerts] = useState<ResourceAlert[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadDashboardData = () => {
      setCurrentMetrics(adminDashboardService.getCurrentMetrics());
      setMetricsHistory(adminDashboardService.getMetricsHistory().slice(-10));
      setActiveSessions(adminDashboardService.getActiveSessions());
      setCriticalAlerts(adminDashboardService.getCriticalAlerts());
      setAllAlerts(adminDashboardService.getActiveAlerts());
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!currentMetrics) {
    return null;
  }

  const chartData = metricsHistory.map((m) => ({
    timestamp: new Date(m.timestamp).toLocaleTimeString(),
    cpu: m.cpuUsage,
    memory: m.memoryUsage,
    disk: m.diskUsage,
    errors: m.errorRate * 100,
  }));

  const resourceData = [
    { name: 'CPU', value: currentMetrics.cpuUsage },
    { name: 'Memory', value: currentMetrics.memoryUsage },
    { name: 'Disk', value: currentMetrics.diskUsage },
  ];

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-blue-100">System Monitoring & Analytics</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-blue-700"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Health Score and Critical Alerts */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">System Health</p>
                  <p className="text-4xl font-bold text-green-300 mt-2">
                    {currentMetrics.healthScore}%
                  </p>
                </div>
                <Activity className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Sessions</p>
                  <p className="text-4xl font-bold text-blue-300 mt-2">{activeSessions.length}</p>
                  <p className="text-blue-200 text-xs mt-1">Users online</p>
                </div>
                <Users className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical Alerts</p>
                  <p className="text-4xl font-bold text-red-300 mt-2">{criticalAlerts.length}</p>
                  <p className="text-red-200 text-xs mt-1">Requiring attention</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-semibold mb-2">Critical Alerts Detected:</p>
                <ul className="space-y-1 text-sm">
                  {criticalAlerts.slice(0, 3).map((alert, i) => (
                    <li key={i}>
                      • {alert.resource}: {alert.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Resource Metrics */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Current Resource Usage
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">CPU</span>
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <p
                  className={`text-2xl font-bold ${getMetricColor(currentMetrics.cpuUsage, { warning: 80, critical: 90 })}`}
                >
                  {currentMetrics.cpuUsage}%
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Memory</span>
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <p
                  className={`text-2xl font-bold ${getMetricColor(currentMetrics.memoryUsage, { warning: 85, critical: 95 })}`}
                >
                  {currentMetrics.memoryUsage}%
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Disk</span>
                  <HardDrive className="w-4 h-4 text-purple-500" />
                </div>
                <p
                  className={`text-2xl font-bold ${getMetricColor(currentMetrics.diskUsage, { warning: 80, critical: 90 })}`}
                >
                  {currentMetrics.diskUsage}%
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Response Time</span>
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {currentMetrics.avgResponseTime}ms
                </p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="metrics">Metrics Chart</TabsTrigger>
              <TabsTrigger value="alerts">All Alerts</TabsTrigger>
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            </TabsList>

            {/* Metrics Chart */}
            <TabsContent value="metrics" className="mt-4">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resource Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#374151" />
                    <XAxis stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="disk" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            {/* All Alerts */}
            <TabsContent value="alerts" className="mt-4 space-y-3">
              {allAlerts.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700 p-6 text-center">
                  <p className="text-gray-400">No active alerts</p>
                </Card>
              ) : (
                allAlerts.map((alert, i) => (
                  <Alert
                    key={i}
                    className={`${ALERT_COLORS[alert.severity] || 'bg-blue-50 border-blue-200'}`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}
                    />
                    <AlertDescription
                      className={alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{alert.resource}</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </TabsContent>

            {/* Active Sessions */}
            <TabsContent value="sessions" className="mt-4">
              <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Login Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {activeSessions.map((session, i) => (
                        <tr key={i} className="hover:bg-gray-750">
                          <td className="px-6 py-4 text-sm text-gray-300">{session.userId}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">{session.ipAddress}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {new Date(session.loginTime).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {new Date(session.lastActivityTime).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge className="bg-green-600">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
