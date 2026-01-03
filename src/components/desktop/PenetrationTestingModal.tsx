import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Play,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
  BookOpen,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  penetrationTestingService,
  type SecurityScanResult,
  type VulnerabilityAlert,
  type SimulatedAttackScenario,
} from '@/lib/penetration-testing';

interface PenetrationTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PenetrationTestingModal: React.FC<PenetrationTestingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [scanResults, setScanResults] = useState<SecurityScanResult[]>([]);
  const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [targetHost, setTargetHost] = useState('192.168.1.1');
  const [selectedScan, setSelectedScan] = useState<SecurityScanResult | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [trainingModules, setTrainingModules] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    // Load recent scans
    const history = penetrationTestingService.getScanHistory(5);
    setScanResults(history);

    // Load alerts
    const vulnAlerts = penetrationTestingService.getVulnerabilityAlerts();
    setAlerts(vulnAlerts);

    // Load training modules
    const modules = penetrationTestingService.getTrainingModules();
    setTrainingModules(modules);
  };

  const handleStartScan = async (scanType: 'port-scan' | 'vulnerability-scan' | 'web-scan') => {
    setIsScanning(true);
    try {
      const result = await penetrationTestingService.startSecurityScan(scanType, targetHost);
      setScanResults((prev) => [result, ...prev]);
      setSelectedScan(result);
      setAlerts(penetrationTestingService.getVulnerabilityAlerts());
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateReport = (scanId: string) => {
    const report = penetrationTestingService.generateSecurityReport(scanId);
    setSelectedReport(report);
  };

  const downloadReport = (scanId: string) => {
    const report = penetrationTestingService.generateSecurityReport(scanId);
    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `security-report-${scanId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-purple-500" />
            Penetration Testing & Security Analysis
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="bg-gray-800 border-b border-gray-700">
            <TabsTrigger value="scan">Vulnerability Scan</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
            <TabsTrigger value="training">Security Training</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Scan Tab */}
          <TabsContent value="scan" className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-white">Start Security Scan</h3>

              <div className="flex gap-2">
                <Input
                  value={targetHost}
                  onChange={(e) => setTargetHost(e.target.value)}
                  placeholder="Enter target host or IP"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleStartScan('port-scan')}
                  disabled={isScanning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Port Scan
                </Button>
                <Button
                  onClick={() => handleStartScan('vulnerability-scan')}
                  disabled={isScanning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Vulnerability Scan
                </Button>
                <Button
                  onClick={() => handleStartScan('web-scan')}
                  disabled={isScanning}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Web Scan
                </Button>
              </div>

              {isScanning && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Scanning in progress...
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Recent Scans */}
            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
              {scanResults.length === 0 ? (
                <p className="text-gray-400 text-sm">No scans performed yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scanResults.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition"
                      onClick={() => setSelectedScan(scan)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm capitalize">{scan.scanType}</p>
                          <p className="text-gray-400 text-xs">{scan.targetHost}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-bold text-white">{scan.score}/100</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scan Details */}
            {selectedScan && (
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Scan Details</h3>
                  <Button
                    size="sm"
                    onClick={() => downloadReport(selectedScan.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Target</p>
                    <p className="text-white font-semibold">{selectedScan.targetHost}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-semibold">{selectedScan.duration}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vulnerabilities</p>
                    <p className="text-white font-semibold">{selectedScan.vulnerabilitiesFound.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Security Score</p>
                    <p className={`font-semibold ${selectedScan.score >= 80 ? 'text-green-400' : selectedScan.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {selectedScan.score}/100
                    </p>
                  </div>
                </div>

                {selectedScan.vulnerabilitiesFound.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white font-semibold mb-2">Vulnerabilities:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedScan.vulnerabilitiesFound.map((vuln) => (
                        <div key={vuln.id} className={`p-2 rounded text-xs ${getSeverityColor(vuln.severity)}`}>
                          <p className="font-semibold">{vuln.title}</p>
                          <p className="opacity-80">{vuln.affectedComponent}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-3 max-h-48 overflow-y-auto">
            {alerts.length === 0 ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">No active alerts</AlertDescription>
              </Alert>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm capitalize">{alert.vulnerability.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">CVE: {alert.vulnerability.cveId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-3 max-h-48 overflow-y-auto">
            {trainingModules.map((module) => (
              <Card key={module.id} className="bg-gray-800 border-gray-700 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{module.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{module.topic}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">{module.level}</Badge>
                      <Badge variant="outline" className="text-xs">{module.duration} min</Badge>
                    </div>
                  </div>
                  <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-3">
            {selectedReport ? (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Security Report</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReport('')}
                  >
                    Close
                  </Button>
                </div>
                <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {selectedReport}
                </pre>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select a scan to generate report</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PenetrationTestingModal;
