import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, AlertTriangle, Key, Smartphone, Shield } from 'lucide-react';
import { mfaService, type TOTPSetup } from '@/lib/mfa-service';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const MFASetupModal: React.FC<MFASetupModalProps> = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup' | 'complete'>(
    'method'
  );
  const [method, setMethod] = useState<'totp' | 'email'>('totp');
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const handleStartSetup = () => {
    if (method === 'totp') {
      const setup = mfaService.initializeTOTPSetup(userId);
      setTotpSetup(setup);
      setStep('setup');
    }
  };

  const handleVerifyCode = () => {
    setIsVerifying(true);

    if (totpSetup) {
      const verification = mfaService.verifyTOTP(userId, verificationCode);

      if (verification.verified && totpSetup) {
        const config = mfaService.enableTOTP(userId, totpSetup);
        setBackupCodes(config.backupCodes);
        setStep('backup');
      }
    }

    setIsVerifying(false);
  };

  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleComplete = () => {
    setStep('complete');
    setTimeout(onClose, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-blue-500" />
            Setup Multi-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {step === 'method' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* TOTP Option */}
              <Card
                className={`p-4 cursor-pointer transition ${
                  method === 'totp'
                    ? 'bg-blue-600 border-blue-400'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}
                onClick={() => setMethod('totp')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5" />
                  <p className="font-semibold">Authenticator App</p>
                </div>
                <p className="text-sm text-gray-300">
                  Use an authenticator app like Google Authenticator or Authy
                </p>
                {method === 'totp' && <CheckCircle className="w-5 h-5 mt-3 text-green-400" />}
              </Card>

              {/* Email Option */}
              <Card
                className={`p-4 cursor-pointer transition ${
                  method === 'email'
                    ? 'bg-blue-600 border-blue-400'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}
                onClick={() => setMethod('email')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-5 h-5" />
                  <p className="font-semibold">Email Codes</p>
                </div>
                <p className="text-sm text-gray-300">Receive verification codes via email</p>
                {method === 'email' && <CheckCircle className="w-5 h-5 mt-3 text-green-400" />}
              </Card>
            </div>

            <Button onClick={handleStartSetup} className="w-full bg-blue-600 hover:bg-blue-700">
              Continue with {method === 'totp' ? 'Authenticator App' : 'Email'}
            </Button>
          </div>
        )}

        {step === 'setup' && totpSetup && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Scan this QR code with your authenticator app
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <div
                className="bg-white p-4 rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: totpSetup.qrCode,
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Or enter manually:</p>
              <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-white">
                {totpSetup.manualEntryKey}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Enter the 6-digit code from your app:</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="bg-gray-800 border-gray-700 text-white text-2xl text-center tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isVerifying}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Save these backup codes in a secure location. Each code can be used once if you lose access
                to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Backup Codes:</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-2 rounded flex items-center justify-between cursor-pointer hover:bg-gray-750"
                    onClick={() => copyBackupCode(code, index)}
                  >
                    <span className="font-mono text-sm">{code}</span>
                    <Copy
                      className={`w-4 h-4 transition ${
                        copiedCode === index ? 'text-green-400' : 'text-gray-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              I've Saved My Codes
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-white">MFA Enabled!</p>
              <p className="text-sm text-gray-400">
                Your account is now protected with multi-factor authentication
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MFASetupModal;
