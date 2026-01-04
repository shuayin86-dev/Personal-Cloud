// Audit Logging Service
// Comprehensive activity logging for security and compliance

export type AuditAction = 
  | 'login' | 'logout' | 'mfa_enabled' | 'mfa_disabled' | 'password_changed'
  | 'file_uploaded' | 'file_downloaded' | 'file_deleted' | 'file_shared'
  | 'settings_changed' | 'permissions_modified' | 'ai_query' | 'encryption_key_rotated'
  | 'admin_action' | 'security_alert' | 'access_denied';

export type AuditResourceType = 
  | 'user' | 'file' | 'settings' | 'ai_service' | 'encryption' | 'admin' | 'system';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  changesApplied?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export interface AuditQuery {
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  severity?: string;
}

export interface AuditStats {
  totalEntries: number;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  bySeverity: Record<string, number>;
  failedAttempts: number;
  criticalEvents: number;
  timeRange: { start: Date; end: Date };
}

export class AuditLoggingService {
  private logs: AuditLogEntry[] = [];
  private indexByUserId = new Map<string, AuditLogEntry[]>();
  private indexByAction = new Map<AuditAction, AuditLogEntry[]>();
  private indexByResourceType = new Map<AuditResourceType, AuditLogEntry[]>();
  private maxLogSize: number = 100000; // Keep last 100k entries

  /**
   * Log an audit event
   */
  log(
    userId: string,
    action: AuditAction,
    resourceType: AuditResourceType,
    options: {
      resourceId?: string;
      resourceName?: string;
      details?: Record<string, any>;
      ipAddress: string;
      userAgent: string;
      status?: 'success' | 'failure' | 'warning';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      changesApplied?: { before: Record<string, any>; after: Record<string, any> };
    }
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      resourceType,
      resourceId: options.resourceId,
      resourceName: options.resourceName,
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status: options.status || 'success',
      severity: options.severity || this.calculateSeverity(action),
      changesApplied: options.changesApplied,
    };

    // Add to main log
    this.logs.push(entry);

    // Add to indexes
    this.addToIndex(this.indexByUserId, userId, entry);
    this.addToIndex(this.indexByAction, action, entry);
    this.addToIndex(this.indexByResourceType, resourceType, entry);

    // Enforce size limit
    if (this.logs.length > this.maxLogSize) {
      this.pruneLogs();
    }

    return entry;
  }

  /**
   * Query audit logs
   */
  query(queryParams: AuditQuery): AuditLogEntry[] {
    let results = [...this.logs];

    if (queryParams.userId) {
      results = results.filter((log) => log.userId === queryParams.userId);
    }

    if (queryParams.action) {
      results = results.filter((log) => log.action === queryParams.action);
    }

    if (queryParams.resourceType) {
      results = results.filter((log) => log.resourceType === queryParams.resourceType);
    }

    if (queryParams.startDate) {
      results = results.filter((log) => log.timestamp >= queryParams.startDate!);
    }

    if (queryParams.endDate) {
      results = results.filter((log) => log.timestamp <= queryParams.endDate!);
    }

    if (queryParams.severity) {
      results = results.filter((log) => log.severity === queryParams.severity);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (queryParams.limit) {
      results = results.slice(0, queryParams.limit);
    }

    return results;
  }

  /**
   * Get audit logs for a specific user
   */
  getUserLogs(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.query({ userId, limit });
  }

  /**
   * Get audit logs for a specific resource
   */
  getResourceLogs(
    resourceType: AuditResourceType,
    resourceId?: string,
    limit: number = 100
  ): AuditLogEntry[] {
    const logs = this.query({ resourceType, limit });
    if (resourceId) {
      return logs.filter((log) => log.resourceId === resourceId);
    }
    return logs;
  }

  /**
   * Get failed login attempts
   */
  getFailedLoginAttempts(userId: string, hours: number = 24): AuditLogEntry[] {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.query({
      userId,
      action: 'login',
      status: 'failure',
      startDate,
    });
  }

  /**
   * Get access denied events
   */
  getAccessDeniedEvents(userId?: string, hours: number = 24): AuditLogEntry[] {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.query({
      userId,
      action: 'access_denied',
      startDate,
    });
  }

  /**
   * Get critical security events
   */
  getCriticalEvents(hours: number = 24): AuditLogEntry[] {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.query({
      severity: 'critical',
      startDate,
    });
  }

  /**
   * Get audit statistics
   */
  getStats(startDate?: Date, endDate?: Date): AuditStats {
    const filtered = this.logs.filter((log) => {
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });

    const stats: AuditStats = {
      totalEntries: filtered.length,
      byAction: {},
      byUser: {},
      bySeverity: {},
      failedAttempts: 0,
      criticalEvents: 0,
      timeRange: {
        start: startDate || new Date(0),
        end: endDate || new Date(),
      },
    };

    filtered.forEach((log) => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by user
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;

      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

      // Count failures
      if (log.status === 'failure') {
        stats.failedAttempts += 1;
      }

      // Count critical
      if (log.severity === 'critical') {
        stats.criticalEvents += 1;
      }
    });

    return stats;
  }

  /**
   * Export logs for compliance
   */
  exportLogs(format: 'json' | 'csv', query?: AuditQuery): string {
    const logs = this.query(query || {});

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'Status',
      'Severity',
      'IP Address',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.status,
      log.severity,
      log.ipAddress,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    return csv;
  }

  /**
   * Clear old logs (older than specified days)
   */
  clearOldLogs(olderThanDays: number): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialLength = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp > cutoffDate);

    // Rebuild indexes
    this.rebuildIndexes();

    return initialLength - this.logs.length;
  }

  // Private helper methods

  private calculateSeverity(
    action: AuditAction
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions = ['admin_action', 'encryption_key_rotated', 'security_alert'];
    const highActions = ['mfa_disabled', 'password_changed', 'permissions_modified'];
    const mediumActions = ['file_deleted', 'file_shared', 'settings_changed'];

    if (criticalActions.includes(action)) return 'critical';
    if (highActions.includes(action)) return 'high';
    if (mediumActions.includes(action)) return 'medium';
    return 'low';
  }

  private addToIndex<K>(
    index: Map<K, AuditLogEntry[]>,
    key: K,
    entry: AuditLogEntry
  ): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(entry);
  }

  private pruneLogs(): void {
    const toRemove = this.logs.length - this.maxLogSize + 1000; // Remove 1000 at a time
    if (toRemove > 0) {
      this.logs = this.logs.slice(toRemove);
      this.rebuildIndexes();
    }
  }

  private rebuildIndexes(): void {
    this.indexByUserId.clear();
    this.indexByAction.clear();
    this.indexByResourceType.clear();

    this.logs.forEach((log) => {
      this.addToIndex(this.indexByUserId, log.userId, log);
      this.addToIndex(this.indexByAction, log.action, log);
      this.addToIndex(this.indexByResourceType, log.resourceType, log);
    });
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService();
