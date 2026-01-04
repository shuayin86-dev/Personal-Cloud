import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  Zap,
  Clock,
} from 'lucide-react';
import {
  userAnalyticsService,
  type UserUsageMetrics,
  type UserBehaviorAnalysis,
} from '@/lib/user-analytics';

interface UserAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [allMetrics, setAllMetrics] = useState<UserUsageMetrics[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<UserBehaviorAnalysis[]>([]);
  const [topFeatures, setTopFeatures] = useState<any[]>([]);
  const [selectedUserMetrics, setSelectedUserMetrics] = useState<UserUsageMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadAnalyticsData = () => {
      const metrics = userAnalyticsService.getAllUserMetrics?.() || [];
      const riskUsers = userAnalyticsService.getHighRiskUsers?.() || [];
      const features = userAnalyticsService.getTopFeatures?.() || [];

      setAllMetrics(metrics);
      setHighRiskUsers(riskUsers);

      // Transform top features for chart
      const featureData = Object.entries(features || {}).map(([feature, count]) => ({
        name: feature,
        usage: count,
      }));
      setTopFeatures(featureData);

      // Build activity trends
      const trends = metrics.slice(0, 10).map((m) => ({
        userId: m.userId.substring(0, 8) + '...',
        sessions: m.sessionCount,
        avgDuration: Math.round(m.avgSessionDuration / 60),
        queries: m.aiQueryCount || 0,
      }));
      setChartData(trends);
    };

    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const filteredMetrics = allMetrics.filter((m) =>
    m.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = allMetrics.length;
  const avgSessionsPerUser =
    totalUsers > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + m.sessionCount, 0) / totalUsers)
      : 0;

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return 'text-red-500';
    if (riskScore >= 50) return 'text-orange-500';
    if (riskScore >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">User Analytics</h1>
                <p className="text-teal-100">Activity Metrics & User Behavior</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-teal-700"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-4xl font-bold text-blue-300 mt-2">{totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Avg Sessions/User</p>
                  <p className="text-4xl font-bold text-green-300 mt-2">{avgSessionsPerUser}</p>
                </div>
                <Activity className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">High Risk Users</p>
                  <p className="text-4xl font-bold text-orange-300 mt-2">{highRiskUsers.length}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Top Features</p>
                  <p className="text-4xl font-bold text-purple-300 mt-2">{topFeatures.length}</p>
                </div>
                <Zap className="w-12 h-12 text-purple-400 opacity-50" />
              </div>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">All Users</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Feature Usage Chart */}
                {topFeatures.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      Top Features
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topFeatures}>
                        <CartesianGrid stroke="#374151" />
                        <XAxis stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="usage" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* User Activity Trends */}
                {chartData.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      User Activity Trends
                    </h3>
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
                        <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="avgDuration" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* All Users Tab */}
            <TabsContent value="users" className="mt-4 space-y-4">
              <div className="mb-4">
                <Input
                  placeholder="Search users by ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Sessions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Avg Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          AI Queries
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Last Active
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredMetrics.map((metric, i) => (
                        <tr key={i} className="hover:bg-gray-750">
                          <td className="px-6 py-3 text-sm text-gray-300 font-mono">
                            {metric.userId.substring(0, 12)}...
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            {metric.sessionCount}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            {Math.round(metric.avgSessionDuration / 60)} min
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            {metric.aiQueryCount || 0}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-400">
                            {new Date(metric.lastActiveTime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <Button
                              size="sm"
                              onClick={() => setSelectedUserMetrics(metric)}
                              variant="outline"
                              className="border-gray-600 text-gray-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredMetrics.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    No users found
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Risk Analysis Tab */}
            <TabsContent value="risk" className="mt-4 space-y-4">
              {highRiskUsers.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700 p-6 text-center">
                  <p className="text-gray-400">No high-risk users detected</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {highRiskUsers.map((user, i) => (
                    <Card key={i} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-gray-300">
                            {user.userId.substring(0, 16)}...
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>Risk Score: <span className={getRiskColor(user.riskScore)}>{user.riskScore}</span></span>
                            <span>Anomalies: {user.anomalyCount || 0}</span>
                            <span>Failed Activity: {Math.round(user.failedActivityRate * 100)}%</span>
                          </div>
                        </div>
                        <Badge className={getComplianceColor(user.complianceScore)}>
                          {user.complianceScore}% Compliance
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* User Detail Modal */}
          {selectedUserMetrics && (
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">User Details</h3>
                <Button
                  onClick={() => setSelectedUserMetrics(null)}
                  variant="ghost"
                  className="text-gray-400"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-xs text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedUserMetrics.sessionCount}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-xs text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {Math.round(selectedUserMetrics.avgSessionDuration / 60)}m
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-xs text-gray-400">Files Uploaded</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedUserMetrics.fileOperationCount || 0}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
