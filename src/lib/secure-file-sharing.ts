// Secure File Sharing Service
// Time-limited links, password protection, and access logs

export interface SecureFileShare {
  id: string;
  fileId: string;
  fileName: string;
  ownerId: string;
  shareToken: string;
  createdAt: Date;
  expiresAt: Date;
  maxDownloads?: number;
  downloadsRemaining: number;
  password?: string; // hashed
  requiresAuth: boolean;
  allowPreview: boolean;
  sharedWith?: string[]; // email addresses
  accessLog: ShareAccessLog[];
}

export interface ShareAccessLog {
  accessedAt: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}

export interface ShareStats {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  totalAccesses: number;
  successfulAccesses: number;
  failedAccesses: number;
  mostSharedFiles: { fileName: string; shareCount: number }[];
}

export class SecureFileSharingService {
  private shares = new Map<string, SecureFileShare>();
  private tokenIndex = new Map<string, string>(); // token -> shareId
  private userShares = new Map<string, string[]>(); // userId -> shareIds
  private fileShares = new Map<string, string[]>(); // fileId -> shareIds
  private tokenLength = 32;
  private maxShareAge = 90 * 24 * 60 * 60 * 1000; // 90 days default

  /**
   * Create a secure file share
   */
  createShare(
    fileId: string,
    fileName: string,
    ownerId: string,
    options?: {
      expiresIn?: number; // milliseconds
      maxDownloads?: number;
      password?: string;
      requiresAuth?: boolean;
      allowPreview?: boolean;
      sharedWith?: string[];
    }
  ): SecureFileShare {
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const shareToken = this.generateToken();
    const expiresAt = new Date(Date.now() + (options?.expiresIn || this.maxShareAge));

    const share: SecureFileShare = {
      id: shareId,
      fileId,
      fileName,
      ownerId,
      shareToken,
      createdAt: new Date(),
      expiresAt,
      maxDownloads: options?.maxDownloads,
      downloadsRemaining: options?.maxDownloads || Infinity,
      password: options?.password ? this.hashPassword(options.password) : undefined,
      requiresAuth: options?.requiresAuth || false,
      allowPreview: options?.allowPreview || true,
      sharedWith: options?.sharedWith,
      accessLog: [],
    };

    this.shares.set(shareId, share);
    this.tokenIndex.set(shareToken, shareId);

    // Add to indexes
    if (!this.userShares.has(ownerId)) {
      this.userShares.set(ownerId, []);
    }
    this.userShares.get(ownerId)!.push(shareId);

    if (!this.fileShares.has(fileId)) {
      this.fileShares.set(fileId, []);
    }
    this.fileShares.get(fileId)!.push(shareId);

    return share;
  }

  /**
   * Access a shared file
   */
  accessShare(
    token: string,
    password?: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): { success: boolean; share?: SecureFileShare; error?: string } {
    const shareId = this.tokenIndex.get(token);

    if (!shareId) {
      return { success: false, error: 'Invalid share token' };
    }

    const share = this.shares.get(shareId)!;

    // Check if share is expired
    if (new Date() > share.expiresAt) {
      this.logAccess(share, false, 'Share expired', ipAddress, userAgent);
      return { success: false, error: 'Share link has expired' };
    }

    // Check download limit
    if (share.maxDownloads && share.downloadsRemaining <= 0) {
      this.logAccess(share, false, 'Download limit exceeded', ipAddress, userAgent);
      return { success: false, error: 'Download limit exceeded' };
    }

    // Check password if required
    if (share.password && (!password || !this.verifyPassword(password, share.password))) {
      this.logAccess(share, false, 'Invalid password', ipAddress, userAgent);
      return { success: false, error: 'Invalid password' };
    }

    // Decrement download count
    if (share.maxDownloads && share.downloadsRemaining !== Infinity) {
      share.downloadsRemaining -= 1;
    }

    this.logAccess(share, true, undefined, ipAddress, userAgent);

    return { success: true, share };
  }

  /**
   * Get share by token
   */
  getShareByToken(token: string): SecureFileShare | null {
    const shareId = this.tokenIndex.get(token);
    if (!shareId) return null;
    const share = this.shares.get(shareId);
    return share && new Date() <= share.expiresAt ? share : null;
  }

  /**
   * Get shares for a user
   */
  getUserShares(userId: string, includeExpired: boolean = false): SecureFileShare[] {
    const shareIds = this.userShares.get(userId) || [];
    return shareIds
      .map((id) => this.shares.get(id)!)
      .filter((share) => includeExpired || new Date() <= share.expiresAt);
  }

  /**
   * Get shares for a file
   */
  getFileShares(fileId: string, includeExpired: boolean = false): SecureFileShare[] {
    const shareIds = this.fileShares.get(fileId) || [];
    return shareIds
      .map((id) => this.shares.get(id)!)
      .filter((share) => includeExpired || new Date() <= share.expiresAt);
  }

  /**
   * Update share settings
   */
  updateShare(
    shareId: string,
    updates: {
      expiresAt?: Date;
      maxDownloads?: number;
      password?: string;
      allowPreview?: boolean;
      sharedWith?: string[];
    }
  ): boolean {
    const share = this.shares.get(shareId);
    if (!share) return false;

    if (updates.expiresAt) share.expiresAt = updates.expiresAt;
    if (updates.maxDownloads !== undefined) share.maxDownloads = updates.maxDownloads;
    if (updates.password) share.password = this.hashPassword(updates.password);
    if (updates.allowPreview !== undefined) share.allowPreview = updates.allowPreview;
    if (updates.sharedWith) share.sharedWith = updates.sharedWith;

    return true;
  }

  /**
   * Revoke a share
   */
  revokeShare(shareId: string): boolean {
    const share = this.shares.get(shareId);
    if (!share) return false;

    this.shares.delete(shareId);
    this.tokenIndex.delete(share.shareToken);

    // Remove from indexes
    const userShares = this.userShares.get(share.ownerId);
    if (userShares) {
      const index = userShares.indexOf(shareId);
      if (index > -1) userShares.splice(index, 1);
    }

    const fileShares = this.fileShares.get(share.fileId);
    if (fileShares) {
      const index = fileShares.indexOf(shareId);
      if (index > -1) fileShares.splice(index, 1);
    }

    return true;
  }

  /**
   * Get access history for a share
   */
  getAccessHistory(shareId: string): ShareAccessLog[] {
    const share = this.shares.get(shareId);
    return share?.accessLog || [];
  }

  /**
   * Get share statistics
   */
  getStats(): ShareStats {
    const now = new Date();
    const allShares = Array.from(this.shares.values());

    const activeShares = allShares.filter((s) => s.expiresAt > now);
    const expiredShares = allShares.filter((s) => s.expiresAt <= now);

    let totalAccesses = 0;
    let successfulAccesses = 0;
    let failedAccesses = 0;

    allShares.forEach((share) => {
      share.accessLog.forEach((log) => {
        totalAccesses += 1;
        if (log.success) {
          successfulAccesses += 1;
        } else {
          failedAccesses += 1;
        }
      });
    });

    const fileShareCounts: Record<string, number> = {};
    allShares.forEach((share) => {
      fileShareCounts[share.fileName] = (fileShareCounts[share.fileName] || 0) + 1;
    });

    const mostSharedFiles = Object.entries(fileShareCounts)
      .map(([fileName, shareCount]) => ({ fileName, shareCount }))
      .sort((a, b) => b.shareCount - a.shareCount)
      .slice(0, 10);

    return {
      totalShares: allShares.length,
      activeShares: activeShares.length,
      expiredShares: expiredShares.length,
      totalAccesses,
      successfulAccesses,
      failedAccesses,
      mostSharedFiles,
    };
  }

  /**
   * Clean up expired shares
   */
  cleanupExpiredShares(): number {
    const now = new Date();
    let removed = 0;

    for (const [shareId, share] of this.shares) {
      if (share.expiresAt < now) {
        this.revokeShare(shareId);
        removed += 1;
      }
    }

    return removed;
  }

  // Private helper methods

  private generateToken(): string {
    let token = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';
    for (let i = 0; i < this.tokenLength; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private hashPassword(password: string): string {
    // Simplified hash (in production, use bcrypt or similar)
    return btoa(password);
  }

  private verifyPassword(password: string, hash: string): boolean {
    // Simplified verification (in production, use bcrypt)
    return btoa(password) === hash;
  }

  private logAccess(
    share: SecureFileShare,
    success: boolean,
    reason?: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): void {
    share.accessLog.push({
      accessedAt: new Date(),
      ipAddress,
      userAgent,
      success,
      reason,
    });

    // Keep only last 1000 access logs
    if (share.accessLog.length > 1000) {
      share.accessLog = share.accessLog.slice(-1000);
    }
  }
}

// Export singleton instance
export const secureFileSharingService = new SecureFileSharingService();
