// Admin Dashboard Service
// Real-time system monitoring and management

export interface SystemMetrics {
  timestamp: Date;
  activeUsers: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  networkBandwidth: number; // MB/s
  requestsPerSecond: number;
  averageResponseTime: number; // milliseconds
  errorRate: number; // percentage
}

export interface ResourceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'error_rate' | 'performance';
  severity: 'warning' | 'critical';
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
  message: string;
}

export interface UserSessionInfo {
  sessionId: string;
  userId: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  device: string;
  location?: string;
  isActive: boolean;
}

export interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'user_action' | 'system_alert' | 'security_event' | 'error';
  severity: 'info' | 'warning' | 'critical';
  userId?: string;
  message: string;
  details?: Record<string, any>;
}

export class AdminDashboardService {
  private metricsHistory: SystemMetrics[] = [];
  private alerts: ResourceAlert[] = [];
  private activeSessions = new Map<string, UserSessionInfo>();
  private systemEvents: SystemEvent[] = [];
  private alertThresholds = {
    cpu: 80,
    memory: 85,
    disk: 90,
    errorRate: 5,
    responseTime: 1000,
  };

  /**
   * Record system metrics
   */
  recordMetrics(metrics: Omit<SystemMetrics, 'timestamp'>): SystemMetrics {
    const metricsWithTimestamp: SystemMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metricsHistory.push(metricsWithTimestamp);

    // Keep last 1000 metrics (roughly 16 hours at 1-minute intervals)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    this.checkAlerts(metricsWithTimestamp);

    return metricsWithTimestamp;
  }

  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(minutes: number = 60): SystemMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Track active user session
   */
  trackSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    device: string,
    location?: string
  ): UserSessionInfo {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: UserSessionInfo = {
      sessionId,
      userId,
      loginTime: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      device,
      location,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * End user session
   */
  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): UserSessionInfo[] {
    return Array.from(this.activeSessions.values()).filter((s) => s.isActive);
  }

  /**
   * Get sessions for user
   */
  getUserSessions(userId: string): UserSessionInfo[] {
    return Array.from(this.activeSessions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Log system event
   */
  logEvent(
    type: SystemEvent['type'],
    severity: SystemEvent['severity'],
    message: string,
    userId?: string,
    details?: Record<string, any>
  ): SystemEvent {
    const event: SystemEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      userId,
      message,
      details,
    };

    this.systemEvents.push(event);

    // Keep last 10000 events
    if (this.systemEvents.length > 10000) {
      this.systemEvents.shift();
    }

    return event;
  }

  /**
   * Get system events
   */
  getSystemEvents(filter?: {
    type?: SystemEvent['type'];
    severity?: SystemEvent['severity'];
    userId?: string;
    limit?: number;
  }): SystemEvent[] {
    let events = [...this.systemEvents];

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }

    if (filter?.severity) {
      events = events.filter((e) => e.severity === filter.severity);
    }

    if (filter?.userId) {
      events = events.filter((e) => e.userId === filter.userId);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ResourceAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(): ResourceAlert[] {
    return this.alerts.filter((a) => a.severity === 'critical' && !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): Record<string, any> {
    const currentMetrics = this.getCurrentMetrics();
    const activeSessions = this.getActiveSessions();
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = this.getCriticalAlerts();
    const recentEvents = this.getSystemEvents({ limit: 20 });

    return {
      timestamp: new Date(),
      system: currentMetrics,
      sessions: {
        active: activeSessions.length,
        byUser: this.getSessionsByUser(activeSessions),
      },
      alerts: {
        active: activeAlerts.length,
        critical: criticalAlerts.length,
      },
      recentEvents,
      healthScore: this.calculateHealthScore(currentMetrics, activeAlerts),
    };
  }

  /**
   * Get resource utilization report
   */
  getResourceReport(minutesBack: number = 60): Record<string, any> {
    const metrics = this.getMetricsHistory(minutesBack);

    if (metrics.length === 0) {
      return {
        period: { start: new Date(), end: new Date() },
        data: null,
      };
    }

    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgDisk = metrics.reduce((sum, m) => sum + m.diskUsage, 0) / metrics.length;
    const peakCpu = Math.max(...metrics.map((m) => m.cpuUsage));
    const peakMemory = Math.max(...metrics.map((m) => m.memoryUsage));
    const peakDisk = Math.max(...metrics.map((m) => m.diskUsage));

    return {
      period: { start: metrics[0].timestamp, end: metrics[metrics.length - 1].timestamp },
      cpu: { average: avgCpu, peak: peakCpu },
      memory: { average: avgMemory, peak: peakMemory },
      disk: { average: avgDisk, peak: peakDisk },
      network: {
        average: metrics.reduce((sum, m) => sum + m.networkBandwidth, 0) / metrics.length,
      },
      errors: {
        average: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      },
    };
  }

  /**
   * Set alert thresholds
   */
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get alert thresholds
   */
  getAlertThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds };
  }

  // Private helper methods

  private checkAlerts(metrics: SystemMetrics): void {
    // Check CPU
    if (metrics.cpuUsage > this.alertThresholds.cpu) {
      this.createAlert('cpu', 'warning', this.alertThresholds.cpu, metrics.cpuUsage, 'High CPU usage detected');
    }

    // Check Memory
    if (metrics.memoryUsage > this.alertThresholds.memory) {
      this.createAlert('memory', 'warning', this.alertThresholds.memory, metrics.memoryUsage, 'High memory usage detected');
    }

    // Check Disk
    if (metrics.diskUsage > this.alertThresholds.disk) {
      this.createAlert('disk', 'critical', this.alertThresholds.disk, metrics.diskUsage, 'Disk space critically low');
    }

    // Check Error Rate
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      this.createAlert('error_rate', 'warning', this.alertThresholds.errorRate, metrics.errorRate, 'High error rate detected');
    }

    // Check Response Time
    if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
      this.createAlert(
        'performance',
        'warning',
        this.alertThresholds.responseTime,
        metrics.averageResponseTime,
        'Slow response times detected'
      );
    }
  }

  private createAlert(
    type: ResourceAlert['type'],
    severity: ResourceAlert['severity'],
    threshold: number,
    currentValue: number,
    message: string
  ): void {
    // Check if similar alert already exists
    const existing = this.alerts.find(
      (a) => a.type === type && !a.acknowledged && a.currentValue === currentValue
    );

    if (!existing) {
      this.alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity,
        threshold,
        currentValue,
        timestamp: new Date(),
        acknowledged: false,
        message,
      });

      // Keep last 1000 alerts
      if (this.alerts.length > 1000) {
        this.alerts.shift();
      }
    }
  }

  private getSessionsByUser(sessions: UserSessionInfo[]): Record<string, number> {
    const byUser: Record<string, number> = {};

    sessions.forEach((session) => {
      byUser[session.userId] = (byUser[session.userId] || 0) + 1;
    });

    return byUser;
  }

  private calculateHealthScore(
    metrics: SystemMetrics | null,
    alerts: ResourceAlert[]
  ): number {
    if (!metrics) return 0;

    let score = 100;

    // Deduct for resource usage
    if (metrics.cpuUsage > 80) score -= 20;
    if (metrics.memoryUsage > 85) score -= 20;
    if (metrics.diskUsage > 90) score -= 20;
    if (metrics.errorRate > 5) score -= 15;
    if (metrics.averageResponseTime > 1000) score -= 15;

    // Deduct for alerts
    score -= alerts.filter((a) => !a.acknowledged).length * 2;

    return Math.max(0, score);
  }
}

// Export singleton instance
export const adminDashboardService = new AdminDashboardService();
