// Collaboration & Social Features Service
// Handles real-time co-editing, project rooms, live streaming, and AI moderation

import { PetState } from './virtual-pet-service';

export interface CollaborationUser {
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  cursorPosition?: { x: number; y: number };
}

export interface CoEditSession {
  id: string;
  documentId: string;
  documentTitle: string;
  owner: string;
  participants: CollaborationUser[];
  content: string;
  lastModified: Date;
  createdAt: Date;
  isActive: boolean;
  permissions: Record<string, 'view' | 'edit' | 'admin'>;
}

export interface ProjectRoom {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: CollaborationUser[];
  sharedFiles: { id: string; name: string; type: string; uploadedBy: string; uploadedAt: Date }[];
  tasks: { id: string; title: string; assignee: string; completed: boolean; dueDate?: Date }[];
  chatHistory: { userId: string; username: string; message: string; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenShare {
  id: string;
  sharedBy: string;
  sharedByName: string;
  viewers: string[];
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  type: 'demo' | 'tutorial' | 'collaboration' | 'presentation';
  title: string;
}

export interface ModerationReport {
  id: string;
  sessionId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'toxic' | 'spam' | 'workflow_issue' | 'performance';
  description: string;
  content: string;
  recommendations: string[];
  automated: boolean;
}

export class CollaborationService {
  private coEditSessions: Map<string, CoEditSession> = new Map();
  private projectRooms: Map<string, ProjectRoom> = new Map();
  private activeScreenShares: Map<string, ScreenShare> = new Map();
  private moderationReports: ModerationReport[] = [];
  private userCursors: Map<string, { userId: string; position: { x: number; y: number } }> = new Map();

  // ============================================================================
  // CO-EDITING SERVICE
  // ============================================================================

  /**
   * Create a new co-editing session
   */
  createCoEditSession(
    documentId: string,
    documentTitle: string,
    ownerId: string,
    initialContent: string = ''
  ): CoEditSession {
    const session: CoEditSession = {
      id: `session-${Date.now()}`,
      documentId,
      documentTitle,
      owner: ownerId,
      participants: [],
      content: initialContent,
      lastModified: new Date(),
      createdAt: new Date(),
      isActive: true,
      permissions: { [ownerId]: 'admin' },
    };

    this.coEditSessions.set(session.id, session);
    return session;
  }

  /**
   * Join a co-editing session
   */
  joinCoEditSession(
    sessionId: string,
    user: CollaborationUser,
    permission: 'view' | 'edit' = 'edit'
  ): CoEditSession | null {
    const session = this.coEditSessions.get(sessionId);
    if (!session) return null;

    // Check if user already in session
    const exists = session.participants.some(p => p.userId === user.userId);
    if (!exists) {
      session.participants.push(user);
    }

    session.permissions[user.userId] = permission;
    return session;
  }

  /**
   * Update document content
   */
  updateDocumentContent(sessionId: string, userId: string, newContent: string): boolean {
    const session = this.coEditSessions.get(sessionId);
    if (!session) return false;

    const permission = session.permissions[userId];
    if (permission !== 'edit' && permission !== 'admin') return false;

    session.content = newContent;
    session.lastModified = new Date();
    return true;
  }

  /**
   * Get co-edit session
   */
  getCoEditSession(sessionId: string): CoEditSession | null {
    return this.coEditSessions.get(sessionId) || null;
  }

  /**
   * End co-editing session
   */
  endCoEditSession(sessionId: string, userId: string): boolean {
    const session = this.coEditSessions.get(sessionId);
    if (!session || session.owner !== userId) return false;

    session.isActive = false;
    session.participants = [];
    return true;
  }

  /**
   * Update user cursor position
   */
  updateUserCursor(sessionId: string, userId: string, x: number, y: number): void {
    const key = `${sessionId}:${userId}`;
    this.userCursors.set(key, { userId, position: { x, y } });
  }

  /**
   * Get all cursors in session
   */
  getSessionCursors(sessionId: string): Array<{ userId: string; position: { x: number; y: number } }> {
    const cursors: Array<{ userId: string; position: { x: number; y: number } }> = [];
    for (const [key, cursor] of this.userCursors) {
      if (key.startsWith(`${sessionId}:`)) {
        cursors.push(cursor);
      }
    }
    return cursors;
  }

  // ============================================================================
  // PROJECT ROOMS SERVICE
  // ============================================================================

  /**
   * Create a new project room
   */
  createProjectRoom(
    name: string,
    description: string,
    owner: string,
    ownerName: string,
    ownerEmail: string
  ): ProjectRoom {
    const room: ProjectRoom = {
      id: `room-${Date.now()}`,
      name,
      description,
      owner,
      members: [
        {
          userId: owner,
          username: ownerName,
          email: ownerEmail,
          isOnline: true,
          lastSeen: new Date(),
        },
      ],
      sharedFiles: [],
      tasks: [],
      chatHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projectRooms.set(room.id, room);
    return room;
  }

  /**
   * Add member to project room
   */
  addMemberToRoom(roomId: string, user: CollaborationUser): boolean {
    const room = this.projectRooms.get(roomId);
    if (!room) return false;

    const exists = room.members.some(m => m.userId === user.userId);
    if (!exists) {
      room.members.push(user);
      room.updatedAt = new Date();
    }

    return true;
  }

  /**
   * Add task to room
   */
  addTaskToRoom(
    roomId: string,
    title: string,
    assignee: string,
    dueDate?: Date
  ): { id: string } | null {
    const room = this.projectRooms.get(roomId);
    if (!room) return null;

    const taskId = `task-${Date.now()}`;
    room.tasks.push({
      id: taskId,
      title,
      assignee,
      completed: false,
      dueDate,
    });

    room.updatedAt = new Date();
    return { id: taskId };
  }

  /**
   * Send message in project room
   */
  sendRoomMessage(roomId: string, userId: string, username: string, message: string): boolean {
    const room = this.projectRooms.get(roomId);
    if (!room) return false;

    room.chatHistory.push({
      userId,
      username,
      message,
      timestamp: new Date(),
    });

    room.updatedAt = new Date();
    return true;
  }

  /**
   * Get project room
   */
  getProjectRoom(roomId: string): ProjectRoom | null {
    return this.projectRooms.get(roomId) || null;
  }

  /**
   * Get all project rooms for a user
   */
  getUserProjectRooms(userId: string): ProjectRoom[] {
    const rooms: ProjectRoom[] = [];
    for (const room of this.projectRooms.values()) {
      if (room.owner === userId || room.members.some(m => m.userId === userId)) {
        rooms.push(room);
      }
    }
    return rooms;
  }

  // ============================================================================
  // SCREEN SHARING SERVICE
  // ============================================================================

  /**
   * Start screen sharing
   */
  startScreenShare(
    userId: string,
    userName: string,
    title: string,
    type: 'demo' | 'tutorial' | 'collaboration' | 'presentation' = 'collaboration'
  ): ScreenShare {
    const share: ScreenShare = {
      id: `share-${Date.now()}`,
      sharedBy: userId,
      sharedByName: userName,
      viewers: [],
      isActive: true,
      startTime: new Date(),
      type,
      title,
    };

    this.activeScreenShares.set(share.id, share);
    return share;
  }

  /**
   * Add viewer to screen share
   */
  addViewerToShare(shareId: string, viewerId: string): boolean {
    const share = this.activeScreenShares.get(shareId);
    if (!share) return false;

    if (!share.viewers.includes(viewerId)) {
      share.viewers.push(viewerId);
    }

    return true;
  }

  /**
   * End screen sharing
   */
  endScreenShare(shareId: string): boolean {
    const share = this.activeScreenShares.get(shareId);
    if (!share) return false;

    share.isActive = false;
    share.endTime = new Date();
    return true;
  }

  /**
   * Get active screen shares
   */
  getActiveScreenShares(): ScreenShare[] {
    return Array.from(this.activeScreenShares.values()).filter(s => s.isActive);
  }

  // ============================================================================
  // AI MODERATION SERVICE
  // ============================================================================

  /**
   * Analyze content for moderation issues
   */
  analyzeContent(
    sessionId: string,
    content: string,
    userId: string
  ): ModerationReport | null {
    const issues = this.detectIssues(content);
    if (issues.length === 0) return null;

    const report: ModerationReport = {
      id: `report-${Date.now()}`,
      sessionId,
      timestamp: new Date(),
      severity: this.calculateSeverity(issues),
      type: issues[0].type,
      description: issues[0].description,
      content,
      recommendations: this.generateRecommendations(issues),
      automated: true,
    };

    this.moderationReports.push(report);
    return report;
  }

  /**
   * Detect moderation issues
   */
  private detectIssues(
    content: string
  ): Array<{ type: 'toxic' | 'spam' | 'workflow_issue'; description: string }> {
    const issues: Array<{ type: 'toxic' | 'spam' | 'workflow_issue'; description: string }> = [];

    // Detect spam patterns
    if (content.length > 0 && content.split('\n').length > 20) {
      issues.push({ type: 'spam', description: 'Excessive multiline message detected' });
    }

    // Detect repeated characters (potential spam)
    if (/(.)\1{10,}/.test(content)) {
      issues.push({ type: 'spam', description: 'Excessive character repetition detected' });
    }

    // Detect potential workflow issues
    if (content.toLowerCase().includes('error') || content.toLowerCase().includes('crash')) {
      issues.push({ type: 'workflow_issue', description: 'Potential workflow issue mentioned' });
    }

    // Simple profanity check (basic example)
    const profanityPatterns = /\b(badword1|badword2|badword3)\b/gi;
    if (profanityPatterns.test(content)) {
      issues.push({ type: 'toxic', description: 'Inappropriate language detected' });
    }

    return issues;
  }

  /**
   * Calculate severity of issues
   */
  private calculateSeverity(
    issues: Array<{ type: string }>
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.some(i => i.type === 'toxic')) return 'high';
    if (issues.some(i => i.type === 'spam')) return 'medium';
    if (issues.some(i => i.type === 'workflow_issue')) return 'low';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: Array<{ type: string }>
  ): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'spam')) {
      recommendations.push('Consider breaking this into smaller, focused messages');
      recommendations.push('Use structured formatting for better clarity');
    }

    if (issues.some(i => i.type === 'toxic')) {
      recommendations.push('Maintain professional communication standards');
      recommendations.push('Use respectful language in team collaborations');
    }

    if (issues.some(i => i.type === 'workflow_issue')) {
      recommendations.push('Document the issue in the project tracking system');
      recommendations.push('Create a dedicated thread for issue discussion');
    }

    return recommendations;
  }

  /**
   * Get moderation reports
   */
  getModerationReports(limit: number = 50): ModerationReport[] {
    return this.moderationReports.slice(-limit);
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(): {
    totalReports: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const stats = {
      totalReports: this.moderationReports.length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: { toxic: 0, spam: 0, workflow_issue: 0, performance: 0 },
    };

    for (const report of this.moderationReports) {
      stats.bySeverity[report.severity]++;
      stats.byType[report.type]++;
    }

    return stats;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all active collaboration sessions
   */
  getAllActiveSessions(): CoEditSession[] {
    return Array.from(this.coEditSessions.values()).filter(s => s.isActive);
  }

  /**
   * Get user's collaboration stats
   */
  getUserCollaborationStats(userId: string) {
    const coEditCount = Array.from(this.coEditSessions.values()).filter(s =>
      s.participants.some(p => p.userId === userId)
    ).length;

    const projectRoomCount = this.getUserProjectRooms(userId).length;

    const screenShareCount = Array.from(this.activeScreenShares.values()).filter(
      s => s.sharedBy === userId || s.viewers.includes(userId)
    ).length;

    return {
      activeCoEditSessions: coEditCount,
      projectRooms: projectRoomCount,
      screenShares: screenShareCount,
      totalCollaborations: coEditCount + projectRoomCount + screenShareCount,
    };
  }

  /**
   * Save collaboration state
   */
  saveState(): string {
    return JSON.stringify({
      coEditSessions: Array.from(this.coEditSessions.values()),
      projectRooms: Array.from(this.projectRooms.values()),
      screenShares: Array.from(this.activeScreenShares.values()),
      moderationReports: this.moderationReports,
    });
  }

  /**
   * Load collaboration state
   */
  loadState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.coEditSessions = new Map(parsed.coEditSessions?.map((s: CoEditSession) => [s.id, s]) || []);
      this.projectRooms = new Map(parsed.projectRooms?.map((r: ProjectRoom) => [r.id, r]) || []);
      this.activeScreenShares = new Map(parsed.screenShares?.map((s: ScreenShare) => [s.id, s]) || []);
      this.moderationReports = parsed.moderationReports || [];
    } catch (error) {
      console.error('Error loading collaboration state:', error);
    }
  }
}

export const createCollaborationService = (): CollaborationService => {
  return new CollaborationService();
};
