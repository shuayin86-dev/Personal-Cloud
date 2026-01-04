// User Analytics Service
// Track usage patterns and provide insights

export interface UserActivity {
  userId: string;
  timestamp: Date;
  action: string;
  resource?: string;
  duration?: number; // milliseconds
  success: boolean;
}

export interface UserUsageMetrics {
  userId: string;
  activeToday: boolean;
  lastActive: Date;
  sessionsThisWeek: number;
  totalFileOperations: number;
  totalAiQueries: number;
  averageSessionDuration: number;
  favoriteFeatures: { feature: string; count: number }[];
  fileAccessPatterns: { time: string; count: number }[];
  peakUsageHours: number[];
}

export interface FeatureUsage {
  featureName: string;
  totalUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  dailyActiveUsers: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UserBehaviorAnalysis {
  userId: string;
  riskScore: number; // 0-100
  abnormalActivities: string[];
  recommendations: string[];
  complianceScore: number; // 0-100
  lastAnalyzed: Date;
}

export class UserAnalyticsService {
  private activities: UserActivity[] = [];
  private userMetrics = new Map<string, UserUsageMetrics>();
  private featureStats = new Map<string, FeatureUsage>();
  private behaviorAnalysis = new Map<string, UserBehaviorAnalysis>();

  /**
   * Record user activity
   */
  recordActivity(activity: UserActivity): void {
    this.activities.push(activity);

    // Update user metrics
    this.updateUserMetrics(activity);

    // Update feature stats
    if (activity.resource) {
      this.updateFeatureStats(activity);
    }
  }

  /**
   * Get user activity metrics
   */
  getUserMetrics(userId: string): UserUsageMetrics {
    let metrics = this.userMetrics.get(userId);

    if (!metrics) {
      metrics = {
        userId,
        activeToday: false,
        lastActive: new Date(0),
        sessionsThisWeek: 0,
        totalFileOperations: 0,
        totalAiQueries: 0,
        averageSessionDuration: 0,
        favoriteFeatures: [],
        fileAccessPatterns: [],
        peakUsageHours: [],
      };
      this.userMetrics.set(userId, metrics);
    }

    return metrics;
  }

  /**
   * Get all user metrics
   */
  getAllUserMetrics(): UserUsageMetrics[] {
    return Array.from(this.userMetrics.values());
  }

  /**
   * Get feature usage statistics
   */
  getFeatureUsage(featureName: string): FeatureUsage {
    return (
      this.featureStats.get(featureName) || {
        featureName,
        totalUsers: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        dailyActiveUsers: 0,
        trend: 'stable',
      }
    );
  }

  /**
   * Get all feature usage statistics
   */
  getAllFeatureUsage(): FeatureUsage[] {
    return Array.from(this.featureStats.values());
  }

  /**
   * Analyze user behavior for anomalies
   */
  analyzeUserBehavior(userId: string): UserBehaviorAnalysis {
    const userActivities = this.activities.filter((a) => a.userId === userId);
    const metrics = this.getUserMetrics(userId);

    const riskScore = this.calculateRiskScore(userActivities, metrics);
    const abnormalActivities = this.detectAbnormalities(userActivities, metrics);
    const recommendations = this.generateRecommendations(riskScore, abnormalActivities);
    const complianceScore = this.calculateComplianceScore(userActivities);

    const analysis: UserBehaviorAnalysis = {
      userId,
      riskScore,
      abnormalActivities,
      recommendations,
      complianceScore,
      lastAnalyzed: new Date(),
    };

    this.behaviorAnalysis.set(userId, analysis);
    return analysis;
  }

  /**
   * Get high-risk users
   */
  getHighRiskUsers(threshold: number = 70): UserBehaviorAnalysis[] {
    return Array.from(this.behaviorAnalysis.values()).filter(
      (analysis) => analysis.riskScore >= threshold
    );
  }

  /**
   * Get top features by usage
   */
  getTopFeatures(limit: number = 10): FeatureUsage[] {
    return Array.from(this.featureStats.values())
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, limit);
  }

  /**
   * Get user activity trends
   */
  getUserActivityTrends(userId: string, days: number = 30): Record<string, number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const userActivities = this.activities.filter(
      (a) => a.userId === userId && a.timestamp >= cutoffDate
    );

    const trends: Record<string, number> = {};

    userActivities.forEach((activity) => {
      const date = activity.timestamp.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return trends;
  }

  /**
   * Compare usage between users
   */
  compareUsers(userIds: string[]): Record<string, UserUsageMetrics> {
    const comparison: Record<string, UserUsageMetrics> = {};

    userIds.forEach((id) => {
      comparison[id] = this.getUserMetrics(id);
    });

    return comparison;
  }

  /**
   * Get weekly summary
   */
  getWeeklySummary(): Record<string, any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyActivities = this.activities.filter(
      (a) => a.timestamp >= weekAgo && a.timestamp <= now
    );

    const activeUsers = new Set(weeklyActivities.map((a) => a.userId));
    const newUsers = this.identifyNewUsers(7);
    const churnedUsers = this.identifyChurnedUsers(7);

    return {
      period: { start: weekAgo, end: now },
      totalActivities: weeklyActivities.length,
      activeUsers: activeUsers.size,
      newUsers: newUsers.length,
      churnedUsers: churnedUsers.length,
      mostActiveUser: this.getMostActiveUser(weeklyActivities),
      topFeatures: this.getTopFeatures(5),
    };
  }

  /**
   * Get monthly summary
   */
  getMonthlySummary(): Record<string, any> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const monthlyActivities = this.activities.filter(
      (a) => a.timestamp >= monthAgo && a.timestamp <= now
    );

    const activeUsers = new Set(monthlyActivities.map((a) => a.userId));
    const successRate = this.calculateSuccessRate(monthlyActivities);

    return {
      period: { start: monthAgo, end: now },
      totalActivities: monthlyActivities.length,
      activeUsers: activeUsers.size,
      successRate,
      topUsers: this.getTopUsers(monthlyActivities, 10),
      topFeatures: this.getTopFeatures(10),
    };
  }

  // Private helper methods

  private updateUserMetrics(activity: UserActivity): void {
    const metrics = this.getUserMetrics(activity.userId);

    // Update last active
    if (activity.timestamp > metrics.lastActive) {
      metrics.lastActive = activity.timestamp;
    }

    // Check if active today
    const today = new Date();
    if (
      activity.timestamp.getDate() === today.getDate() &&
      activity.timestamp.getMonth() === today.getMonth() &&
      activity.timestamp.getFullYear() === today.getFullYear()
    ) {
      metrics.activeToday = true;
    }

    // Count activities
    if (activity.action === 'file_operation') metrics.totalFileOperations += 1;
    if (activity.action === 'ai_query') metrics.totalAiQueries += 1;

    // Track favorite features
    if (activity.resource) {
      const existing = metrics.favoriteFeatures.find((f) => f.feature === activity.resource);
      if (existing) {
        existing.count += 1;
      } else {
        metrics.favoriteFeatures.push({ feature: activity.resource, count: 1 });
      }
    }
  }

  private updateFeatureStats(activity: UserActivity): void {
    if (!activity.resource) return;

    let stats = this.featureStats.get(activity.resource);

    if (!stats) {
      stats = {
        featureName: activity.resource,
        totalUsers: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        dailyActiveUsers: 0,
        trend: 'stable',
      };
      this.featureStats.set(activity.resource, stats);
    }

    stats.totalSessions += 1;

    if (activity.duration) {
      const prevTotal = stats.averageSessionDuration * (stats.totalSessions - 1);
      stats.averageSessionDuration = (prevTotal + activity.duration) / stats.totalSessions;
    }
  }

  private calculateRiskScore(activities: UserActivity[], metrics: UserUsageMetrics): number {
    let score = 0;

    // Failed activity rate
    const failedCount = activities.filter((a) => !a.success).length;
    score += Math.min(40, (failedCount / activities.length) * 100);

    // Unusual timing
    const unusualTiming = this.detectUnusualTiming(activities);
    if (unusualTiming) score += 20;

    // Excessive operations
    if (metrics.totalFileOperations > 1000 || metrics.totalAiQueries > 5000) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private detectAbnormalities(activities: UserActivity[], metrics: UserUsageMetrics): string[] {
    const abnormalities: string[] = [];

    const failureRate = 1 - activities.filter((a) => a.success).length / activities.length;
    if (failureRate > 0.3) {
      abnormalities.push('High failure rate detected');
    }

    if (this.detectUnusualTiming(activities)) {
      abnormalities.push('Access outside normal hours');
    }

    if (metrics.totalFileOperations > 1000) {
      abnormalities.push('Excessive file operations');
    }

    return abnormalities;
  }

  private detectUnusualTiming(activities: UserActivity[]): boolean {
    // Check if activities happen at unusual times (e.g., 3 AM)
    const hours = activities.map((a) => a.timestamp.getHours());
    const unusualHours = hours.filter((h) => h < 6 || h > 22);
    return unusualHours.length > activities.length * 0.5;
  }

  private generateRecommendations(riskScore: number, abnormalities: string[]): string[] {
    const recommendations: string[] = [];

    if (riskScore > 80) {
      recommendations.push('Enable multi-factor authentication');
      recommendations.push('Review recent account activity');
    }

    if (riskScore > 50) {
      recommendations.push('Consider security audit');
    }

    abnormalities.forEach((abnormality) => {
      if (abnormality.includes('failure')) {
        recommendations.push('Review failed access attempts');
      }
      if (abnormality.includes('Excessive')) {
        recommendations.push('Optimize file operation procedures');
      }
    });

    return recommendations;
  }

  private calculateComplianceScore(activities: UserActivity[]): number {
    const successRate =
      activities.filter((a) => a.success).length / Math.max(activities.length, 1);
    return Math.round(successRate * 100);
  }

  private getMostActiveUser(activities: UserActivity[]): string {
    const counts: Record<string, number> = {};

    activities.forEach((a) => {
      counts[a.userId] = (counts[a.userId] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  private getTopUsers(activities: UserActivity[], limit: number): string[] {
    const counts: Record<string, number> = {};

    activities.forEach((a) => {
      counts[a.userId] = (counts[a.userId] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId);
  }

  private calculateSuccessRate(activities: UserActivity[]): number {
    if (activities.length === 0) return 100;
    const successes = activities.filter((a) => a.success).length;
    return Math.round((successes / activities.length) * 100);
  }

  private identifyNewUsers(days: number): string[] {
    // Simplified: users with activities only in the last N days
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentUsers = new Set(this.activities.filter((a) => a.timestamp > cutoff).map((a) => a.userId));
    return Array.from(recentUsers);
  }

  private identifyChurnedUsers(days: number): string[] {
    // Simplified: users who were active but not in the last N days
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentUsers = new Set(this.activities.filter((a) => a.timestamp > cutoff).map((a) => a.userId));
    const oldUsers = new Set(this.activities.filter((a) => a.timestamp <= cutoff).map((a) => a.userId));
    return Array.from(oldUsers).filter((u) => !recentUsers.has(u));
  }
}

// Export singleton instance
export const userAnalyticsService = new UserAnalyticsService();
