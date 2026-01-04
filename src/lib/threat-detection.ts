// Threat Detection Service
// Real-time network traffic analysis and anomaly detection

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type ThreatType =
  | 'brute_force'
  | 'ddos'
  | 'sql_injection'
  | 'xss_attack'
  | 'data_exfiltration'
  | 'unusual_access'
  | 'port_scan'
  | 'malware'
  | 'credential_stuffing'
  | 'anomalous_behavior';

export interface NetworkTraffic {
  id: string;
  timestamp: Date;
  sourceIp: string;
  destinationIp: string;
  port: number;
  protocol: string;
  dataSize: number;
  packetCount: number;
  isEncrypted: boolean;
  userId?: string;
}

export interface ThreatIndicator {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  timestamp: Date;
  sourceIp: string;
  description: string;
  indicators: string[];
  confidence: number; // 0-100
  affectedUsers: string[];
  actionTaken?: string;
  resolved: boolean;
  details?: Record<string, any>;
}

export interface AnomalyDetectionConfig {
  baselineDays: number; // Number of days to calculate baseline
  sensitivityLevel: 'low' | 'medium' | 'high'; // 1-10 scale
  enableAiAnalysis: boolean;
  alertThreshold: number;
  autoBlock: boolean;
}

export interface UserBehaviorBaseline {
  userId: string;
  avgLoginTime: number; // milliseconds
  avgSessionDuration: number;
  typicalLoginHours: number[]; // hours of day
  typicalIps: string[];
  typicalDevices: string[];
  avgDataUsage: number; // bytes
  commonResources: string[];
}

export class ThreatDetectionService {
  private threatIndicators: ThreatIndicator[] = [];
  private networkTraffic: NetworkTraffic[] = [];
  private userBaselines = new Map<string, UserBehaviorBaseline>();
  private ipReputation = new Map<string, { risk: number; threats: string[] }>();
  private suspiciousPatterns: Map<string, number> = new Map(); // pattern -> count
  private config: AnomalyDetectionConfig = {
    baselineDays: 30,
    sensitivityLevel: 'medium',
    enableAiAnalysis: true,
    alertThreshold: 70,
    autoBlock: false,
  };

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Analyze network traffic for threats
   */
  analyzeTraffic(traffic: NetworkTraffic): ThreatIndicator | null {
    this.networkTraffic.push(traffic);

    // Check for various threat patterns
    const threats: ThreatIndicator[] = [];

    // 1. Port scan detection
    if (this.detectPortScan(traffic.sourceIp)) {
      threats.push(
        this.createThreatIndicator(
          'port_scan',
          traffic.sourceIp,
          'Potential port scanning detected'
        )
      );
    }

    // 2. DDoS detection
    if (this.detectDDoS(traffic.sourceIp, traffic.destinationIp)) {
      threats.push(
        this.createThreatIndicator(
          'ddos',
          traffic.sourceIp,
          'Potential DDoS attack detected'
        )
      );
    }

    // 3. Data exfiltration detection
    if (traffic.dataSize > this.getAverageDataSize(traffic.userId) * 5) {
      threats.push(
        this.createThreatIndicator(
          'data_exfiltration',
          traffic.sourceIp,
          'Unusually large data transfer detected'
        )
      );
    }

    // 4. Unusual access pattern detection
    if (traffic.userId && this.detectUnusualAccess(traffic.userId, traffic.sourceIp)) {
      threats.push(
        this.createThreatIndicator(
          'unusual_access',
          traffic.sourceIp,
          'Access from unusual location or time'
        )
      );
    }

    // 5. IP reputation check
    if (this.isIpSuspicious(traffic.sourceIp)) {
      threats.push(
        this.createThreatIndicator(
          'malware',
          traffic.sourceIp,
          'Traffic from known malicious IP'
        )
      );
    }

    // Store all threats
    threats.forEach((threat) => this.threatIndicators.push(threat));

    return threats.length > 0 ? threats[0] : null;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(payload: string): boolean {
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\binsert\b.*\binto\b)/gi,
      /(\bdrop\b.*\btable\b|\bupdate\b.*\bset\b)/gi,
      /(\'.*=.*\'|\".*=.*\")/g,
      /(\bor\b.*=|--|\#|\/\*|\*\/)/gi,
    ];

    return sqlPatterns.some((pattern) => pattern.test(payload));
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(payload: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=\s*["\']?[^"\']*["\']?/gi,
      /javascript:/gi,
      /<iframe[^>]*>/gi,
      /eval\s*\(/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(payload));
  }

  /**
   * Build user behavior baseline
   */
  buildUserBaseline(userId: string, historicalData: any[]): UserBehaviorBaseline {
    const loginTimes: number[] = [];
    const sessionDurations: number[] = [];
    const loginHours: number[] = [];
    const ips: string[] = [];
    const devices: string[] = [];
    const dataUsages: number[] = [];
    const resources: string[] = [];

    historicalData.forEach((entry) => {
      if (entry.loginTime) loginTimes.push(entry.loginTime);
      if (entry.sessionDuration) sessionDurations.push(entry.sessionDuration);
      if (entry.timestamp) loginHours.push(new Date(entry.timestamp).getHours());
      if (entry.sourceIp) ips.push(entry.sourceIp);
      if (entry.device) devices.push(entry.device);
      if (entry.dataSize) dataUsages.push(entry.dataSize);
      if (entry.resource) resources.push(entry.resource);
    });

    const baseline: UserBehaviorBaseline = {
      userId,
      avgLoginTime: loginTimes.length > 0 ? loginTimes.reduce((a, b) => a + b) / loginTimes.length : 0,
      avgSessionDuration: sessionDurations.length > 0 ? sessionDurations.reduce((a, b) => a + b) / sessionDurations.length : 0,
      typicalLoginHours: [...new Set(loginHours)],
      typicalIps: [...new Set(ips)],
      typicalDevices: [...new Set(devices)],
      avgDataUsage: dataUsages.length > 0 ? dataUsages.reduce((a, b) => a + b) / dataUsages.length : 0,
      commonResources: [...new Set(resources)],
    };

    this.userBaselines.set(userId, baseline);
    return baseline;
  }

  /**
   * Get threat indicators
   */
  getThreats(filter?: { resolved?: boolean; level?: ThreatLevel }): ThreatIndicator[] {
    return this.threatIndicators.filter((threat) => {
      if (filter?.resolved !== undefined && threat.resolved !== filter.resolved) return false;
      if (filter?.level && threat.level !== filter.level) return false;
      return true;
    });
  }

  /**
   * Get critical threats
   */
  getCriticalThreats(): ThreatIndicator[] {
    return this.getThreats({ level: 'critical', resolved: false });
  }

  /**
   * Resolve a threat
   */
  resolveThreat(threatId: string, actionTaken: string): boolean {
    const threat = this.threatIndicators.find((t) => t.id === threatId);
    if (threat) {
      threat.resolved = true;
      threat.actionTaken = actionTaken;
      return true;
    }
    return false;
  }

  /**
   * Report IP as suspicious
   */
  reportIpSuspicious(ip: string, reason: string, risk: number): void {
    if (!this.ipReputation.has(ip)) {
      this.ipReputation.set(ip, { risk: 0, threats: [] });
    }
    const entry = this.ipReputation.get(ip)!;
    entry.risk = Math.max(entry.risk, risk);
    entry.threats.push(reason);
  }

  /**
   * Get threat statistics
   */
  getStats(): Record<string, any> {
    const totalThreats = this.threatIndicators.length;
    const unresolvedThreats = this.threatIndicators.filter((t) => !t.resolved).length;
    const criticalThreats = this.threatIndicators.filter((t) => t.level === 'critical').length;

    const byType: Record<string, number> = {};
    this.threatIndicators.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    const byLevel: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    this.threatIndicators.forEach((t) => {
      byLevel[t.level] += 1;
    });

    return {
      totalThreats,
      unresolvedThreats,
      criticalThreats,
      byType,
      byLevel,
      averageConfidence:
        this.threatIndicators.length > 0
          ? this.threatIndicators.reduce((sum, t) => sum + t.confidence, 0) /
            this.threatIndicators.length
          : 0,
    };
  }

  // Private helper methods

  private detectPortScan(sourceIp: string): boolean {
    const key = `portscan:${sourceIp}`;
    const count = (this.suspiciousPatterns.get(key) || 0) + 1;
    this.suspiciousPatterns.set(key, count);

    // Flag as port scan if more than 10 connections in short time
    return count > 10;
  }

  private detectDDoS(sourceIp: string, destIp: string): boolean {
    const key = `ddos:${destIp}`;
    const count = (this.suspiciousPatterns.get(key) || 0) + 1;
    this.suspiciousPatterns.set(key, count);

    // Flag as DDoS if same destination receives >50 requests
    return count > 50;
  }

  private detectUnusualAccess(userId: string, sourceIp: string): boolean {
    const baseline = this.userBaselines.get(userId);
    if (!baseline) return false;

    // Check if IP is in typical IPs
    if (baseline.typicalIps.length > 0 && !baseline.typicalIps.includes(sourceIp)) {
      return true;
    }

    return false;
  }

  private getAverageDataSize(userId?: string): number {
    if (!userId) return 1000000; // 1MB default
    const baseline = this.userBaselines.get(userId);
    return baseline?.avgDataUsage || 1000000;
  }

  private isIpSuspicious(ip: string): boolean {
    const reputation = this.ipReputation.get(ip);
    return reputation ? reputation.risk > 60 : false;
  }

  private createThreatIndicator(
    type: ThreatType,
    sourceIp: string,
    description: string
  ): ThreatIndicator {
    return {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      level: this.calculateThreatLevel(type),
      timestamp: new Date(),
      sourceIp,
      description,
      indicators: [sourceIp],
      confidence: Math.floor(Math.random() * 40 + 60), // 60-100
      affectedUsers: [],
      resolved: false,
    };
  }

  private calculateThreatLevel(type: ThreatType): ThreatLevel {
    const criticalTypes = ['ddos', 'data_exfiltration', 'malware'];
    const highTypes = ['sql_injection', 'xss_attack', 'brute_force'];

    if (criticalTypes.includes(type)) return 'critical';
    if (highTypes.includes(type)) return 'high';
    return 'medium';
  }
}

// Export singleton instance
export const threatDetectionService = new ThreatDetectionService({
  sensitivityLevel: 'medium',
  enableAiAnalysis: true,
});
