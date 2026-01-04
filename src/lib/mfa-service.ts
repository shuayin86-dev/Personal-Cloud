// Multi-Factor Authentication Service
// Implements time-based one-time password (TOTP) and backup codes

export interface MFAConfig {
  userId: string;
  enabled: boolean;
  method: 'totp' | 'email' | 'sms';
  secret?: string;
  backupCodes: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface MFAVerification {
  method: 'totp' | 'backup';
  verified: boolean;
  timestamp: Date;
  ipAddress?: string;
  device?: string;
}

export interface DeviceTrust {
  id: string;
  userId: string;
  deviceName: string;
  deviceId: string;
  trustedUntil: Date;
  lastUsed: Date;
  ipAddress: string;
  userAgent: string;
}

export class MFAService {
  private mfaConfigs = new Map<string, MFAConfig>();
  private trustedDevices = new Map<string, DeviceTrust[]>();
  private verificationHistory = new Map<string, MFAVerification[]>();

  /**
   * Initialize TOTP setup for a user
   */
  initializeTOTPSetup(userId: string): TOTPSetup {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes(10);
    const qrCode = this.generateQRCode(userId, secret);

    return {
      secret,
      qrCode,
      backupCodes,
      manualEntryKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
    };
  }

  /**
   * Enable TOTP for a user
   */
  enableTOTP(userId: string, setup: TOTPSetup): MFAConfig {
    const config: MFAConfig = {
      userId,
      enabled: true,
      method: 'totp',
      secret: setup.secret,
      backupCodes: setup.backupCodes,
      createdAt: new Date(),
    };

    this.mfaConfigs.set(userId, config);
    return config;
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(userId: string, token: string, ipAddress?: string): MFAVerification {
    const config = this.mfaConfigs.get(userId);
    
    if (!config || !config.secret) {
      return {
        method: 'totp',
        verified: false,
        timestamp: new Date(),
        ipAddress,
      };
    }

    const isValid = this.validateTOTPToken(config.secret, token);

    const verification: MFAVerification = {
      method: 'totp',
      verified: isValid,
      timestamp: new Date(),
      ipAddress,
    };

    if (isValid) {
      config.lastUsed = new Date();
      this.recordVerification(userId, verification);
    }

    return verification;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(userId: string, code: string, ipAddress?: string): MFAVerification {
    const config = this.mfaConfigs.get(userId);

    if (!config) {
      return {
        method: 'backup',
        verified: false,
        timestamp: new Date(),
        ipAddress,
      };
    }

    const codeIndex = config.backupCodes.findIndex(
      (c) => c === code || c === code.replace(/\s/g, '')
    );

    const verified = codeIndex !== -1;

    if (verified) {
      // Remove used backup code
      config.backupCodes.splice(codeIndex, 1);
      config.lastUsed = new Date();
    }

    const verification: MFAVerification = {
      method: 'backup',
      verified,
      timestamp: new Date(),
      ipAddress,
    };

    this.recordVerification(userId, verification);

    return verification;
  }

  /**
   * Generate backup codes for recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode(8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Regenerate backup codes (invalidates old ones)
   */
  regenerateBackupCodes(userId: string): string[] {
    const config = this.mfaConfigs.get(userId);
    if (!config) return [];

    const newCodes = this.generateBackupCodes(10);
    config.backupCodes = newCodes;
    return newCodes;
  }

  /**
   * Trust device for N days
   */
  trustDevice(
    userId: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string,
    days: number = 30
  ): DeviceTrust {
    const deviceId = this.generateDeviceId(ipAddress, userAgent);
    const device: DeviceTrust = {
      id: `device-${Date.now()}`,
      userId,
      deviceName,
      deviceId,
      trustedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      lastUsed: new Date(),
      ipAddress,
      userAgent,
    };

    if (!this.trustedDevices.has(userId)) {
      this.trustedDevices.set(userId, []);
    }

    this.trustedDevices.get(userId)!.push(device);
    return device;
  }

  /**
   * Check if device is trusted
   */
  isDeviceTrusted(userId: string, ipAddress: string, userAgent: string): boolean {
    const devices = this.trustedDevices.get(userId) || [];
    const deviceId = this.generateDeviceId(ipAddress, userAgent);

    return devices.some((d) => d.deviceId === deviceId && d.trustedUntil > new Date());
  }

  /**
   * Get trusted devices for user
   */
  getTrustedDevices(userId: string): DeviceTrust[] {
    return (this.trustedDevices.get(userId) || []).filter(
      (d) => d.trustedUntil > new Date()
    );
  }

  /**
   * Revoke device trust
   */
  revokeDeviceTrust(userId: string, deviceId: string): boolean {
    const devices = this.trustedDevices.get(userId);
    if (!devices) return false;

    const index = devices.findIndex((d) => d.id === deviceId);
    if (index !== -1) {
      devices.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get MFA verification history
   */
  getVerificationHistory(userId: string, limit: number = 50): MFAVerification[] {
    return (this.verificationHistory.get(userId) || []).slice(-limit);
  }

  /**
   * Disable MFA for user
   */
  disableMFA(userId: string): void {
    const config = this.mfaConfigs.get(userId);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * Get MFA status
   */
  getMFAStatus(userId: string): MFAConfig | null {
    return this.mfaConfigs.get(userId) || null;
  }

  // Private helper methods

  private generateSecret(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateQRCode(userId: string, secret: string): string {
    // In production, use qrcode library
    // For now, return encoded data
    const issuer = 'PersonalCloud';
    const otpauth = `otpauth://totp/${issuer}:${userId}?secret=${secret}&issuer=${issuer}`;
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50" y="100" font-size="12">${otpauth}</text></svg>`;
  }

  private validateTOTPToken(secret: string, token: string): boolean {
    // Simplified TOTP validation
    // In production, use speakeasy or similar library
    const now = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const digits = 6;

    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const time = Math.floor((now + i * timeStep) / timeStep);
      const hmac = this.hmacSHA1(secret, time.toString());
      const offset = hmac.charCodeAt(hmac.length - 1) & 0xf;
      const code =
        ((hmac.charCodeAt(offset) & 0x7f) << 24) |
        ((hmac.charCodeAt(offset + 1) & 0xff) << 16) |
        ((hmac.charCodeAt(offset + 2) & 0xff) << 8) |
        (hmac.charCodeAt(offset + 3) & 0xff);

      const expectedToken = (code % Math.pow(10, digits))
        .toString()
        .padStart(digits, '0');
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  private hmacSHA1(secret: string, message: string): string {
    // Simplified HMAC-SHA1 (in production, use crypto library)
    return btoa(secret + message);
  }

  private generateRandomCode(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateDeviceId(ipAddress: string, userAgent: string): string {
    // Simple device ID generation
    return btoa(ipAddress + userAgent).substring(0, 32);
  }

  private recordVerification(userId: string, verification: MFAVerification): void {
    if (!this.verificationHistory.has(userId)) {
      this.verificationHistory.set(userId, []);
    }
    this.verificationHistory.get(userId)!.push(verification);
  }
}

// Export singleton instance
export const mfaService = new MFAService();
