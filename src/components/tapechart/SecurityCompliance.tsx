import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';
import {
  Shield, Lock, Key, Eye, EyeOff, UserCheck,
  AlertTriangle, CheckCircle, XCircle, Clock,
  FileText, Download, Trash2, RefreshCw,
  Globe, Database, Fingerprint, Smartphone
} from 'lucide-react';

// Security & Compliance Types
interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethod: 'sms' | 'email' | 'authenticator' | 'biometric';
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    requireUppercase: boolean;
    expiration: number;
  };
  dataEncryption: {
    encryptionLevel: 'basic' | 'advanced' | 'enterprise';
    keyRotation: boolean;
    backupEncryption: boolean;
  };
  auditLogging: {
    enabled: boolean;
    retention: number;
    realTimeMonitoring: boolean;
  };
}

interface GDPRSettings {
  enabled: boolean;
  dataRetentionPeriod: number;
  cookieConsent: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  privacyByDesign: boolean;
  dataProcessingLogs: boolean;
  consentManagement: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityThreat {
  id: string;
  timestamp: string;
  type: 'suspicious_login' | 'data_breach_attempt' | 'unauthorized_access' | 'malware' | 'phishing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  status: 'active' | 'investigated' | 'resolved' | 'false_positive';
  mitigationActions: string[];
}

interface ComplianceCheck {
  id: string;
  standard: 'GDPR' | 'PCI_DSS' | 'CCPA' | 'HIPAA' | 'ISO_27001';
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  lastCheck: string;
  nextCheck: string;
  details: string;
  remediationActions: string[];
}

export const SecurityCompliance: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    mfaEnabled: true,
    mfaMethod: 'authenticator',
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 12,
      requireNumbers: true,
      requireSpecialChars: true,
      requireUppercase: true,
      expiration: 90
    },
    dataEncryption: {
      encryptionLevel: 'enterprise',
      keyRotation: true,
      backupEncryption: true
    },
    auditLogging: {
      enabled: true,
      retention: 365,
      realTimeMonitoring: true
    }
  });

  const [gdprSettings, setGDPRSettings] = useState<GDPRSettings>({
    enabled: true,
    dataRetentionPeriod: 1095, // 3 years
    cookieConsent: true,
    rightToErasure: true,
    dataPortability: true,
    privacyByDesign: true,
    dataProcessingLogs: true,
    consentManagement: true
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    loadSecurityData();
    calculateSecurityScore();
  }, [securitySettings, gdprSettings]);

  const loadSecurityData = () => {
    // Load mock audit logs
    const mockAuditLogs: AuditLog[] = [
      {
        id: 'audit-001',
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        userName: 'John Smith',
        action: 'LOGIN',
        resource: 'Dashboard',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'success',
        details: 'Successful login with MFA',
        riskLevel: 'low'
      },
      {
        id: 'audit-002',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: 'user-456',
        userName: 'Jane Doe',
        action: 'DATA_EXPORT',
        resource: 'Guest Records',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        status: 'success',
        details: 'Exported 150 guest records for analytics',
        riskLevel: 'medium'
      },
      {
        id: 'audit-003',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        userId: 'unknown',
        userName: 'Unknown User',
        action: 'LOGIN_ATTEMPT',
        resource: 'Admin Panel',
        ipAddress: '45.123.45.67',
        userAgent: 'Automated Bot',
        status: 'failed',
        details: 'Failed login attempt - suspicious IP',
        riskLevel: 'high'
      }
    ];

    // Load mock security threats
    const mockThreats: SecurityThreat[] = [
      {
        id: 'threat-001',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        type: 'suspicious_login',
        severity: 'high',
        source: '45.123.45.67',
        description: 'Multiple failed login attempts from suspicious IP address',
        status: 'investigated',
        mitigationActions: ['IP blocked', 'User accounts secured', 'Monitoring increased']
      },
      {
        id: 'threat-002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'unauthorized_access',
        severity: 'medium',
        source: 'Internal Network',
        description: 'Attempt to access restricted guest data without authorization',
        status: 'resolved',
        mitigationActions: ['Access revoked', 'User training scheduled', 'Permissions reviewed']
      }
    ];

    // Load mock compliance checks
    const mockCompliance: ComplianceCheck[] = [
      {
        id: 'comp-001',
        standard: 'GDPR',
        requirement: 'Data retention policy implementation',
        status: 'compliant',
        lastCheck: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        nextCheck: new Date(Date.now() + 2592000000).toISOString(), // 1 month from now
        details: 'Automated data retention policy active, guest data purged after 3 years',
        remediationActions: []
      },
      {
        id: 'comp-002',
        standard: 'PCI_DSS',
        requirement: 'Payment data encryption',
        status: 'compliant',
        lastCheck: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        nextCheck: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        details: 'All payment data encrypted with AES-256, keys rotated monthly',
        remediationActions: []
      },
      {
        id: 'comp-003',
        standard: 'ISO_27001',
        requirement: 'Access control management',
        status: 'partial',
        lastCheck: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        nextCheck: new Date(Date.now() + 604800000).toISOString(), // 1 week from now
        details: 'Role-based access implemented, regular reviews needed',
        remediationActions: ['Schedule quarterly access reviews', 'Implement privileged access management']
      }
    ];

    setAuditLogs(mockAuditLogs);
    setSecurityThreats(mockThreats);
    setComplianceChecks(mockCompliance);
  };

  const calculateSecurityScore = () => {
    let score = 0;

    // MFA enabled
    if (securitySettings.mfaEnabled) score += 20;

    // Strong password policy
    if (securitySettings.passwordPolicy.minLength >= 12) score += 15;
    if (securitySettings.passwordPolicy.requireNumbers) score += 5;
    if (securitySettings.passwordPolicy.requireSpecialChars) score += 5;
    if (securitySettings.passwordPolicy.requireUppercase) score += 5;

    // Encryption level
    switch (securitySettings.dataEncryption.encryptionLevel) {
      case 'enterprise': score += 20; break;
      case 'advanced': score += 15; break;
      case 'basic': score += 10; break;
    }

    // GDPR compliance
    if (gdprSettings.enabled) score += 15;
    if (gdprSettings.dataProcessingLogs) score += 10;
    if (gdprSettings.consentManagement) score += 5;

    setSecurityScore(Math.min(score, 100));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      success: 'text-green-600',
      failed: 'text-red-600',
      warning: 'text-yellow-600',
      compliant: 'bg-green-100 text-green-800',
      non_compliant: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800',
      active: 'bg-red-100 text-red-800',
      investigated: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      false_positive: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[risk as keyof typeof colors] || 'text-gray-600';
  };

  const exportAuditLogs = () => {
    // Mock export functionality
    toast.success('Audit logs exported successfully');
    console.log('📊 Exporting audit logs...', auditLogs);
  };

  const runComplianceCheck = (standard: string) => {
    toast.info(`Running ${standard} compliance check...`);
    // Mock compliance check
    setTimeout(() => {
      toast.success(`${standard} compliance check completed`);
    }, 2000);
  };

  const resolveThreat = (threatId: string) => {
    setSecurityThreats(prev =>
      prev.map(threat =>
        threat.id === threatId
          ? { ...threat, status: 'resolved' }
          : threat
      )
    );
    toast.success('Security threat marked as resolved');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          Security & Compliance
          <Badge className="bg-red-100 text-red-800">Phase 3</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Security & Compliance Center
            <Badge className="bg-red-100 text-red-800">
              Innovation Leadership
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Advanced security features, GDPR compliance, and comprehensive audit system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="mfa">MFA & Auth</TabsTrigger>
            <TabsTrigger value="gdpr">GDPR</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Security Dashboard */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>
                        {securityScore}%
                      </p>
                      <p className="text-xs text-gray-600">{getScoreStatus(securityScore)}</p>
                    </div>
                    <Shield className={`h-8 w-8 ${getScoreColor(securityScore)}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Threats</p>
                      <p className="text-3xl font-bold text-red-600">
                        {securityThreats.filter(t => t.status === 'active').length}
                      </p>
                      <p className="text-xs text-gray-600">Requires attention</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">MFA Users</p>
                      <p className="text-3xl font-bold text-green-600">
                        {securitySettings.mfaEnabled ? '95%' : '0%'}
                      </p>
                      <p className="text-xs text-gray-600">Enrolled</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Compliance</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {Math.round((complianceChecks.filter(c => c.status === 'compliant').length / complianceChecks.length) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Standards met</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Security Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Multi-Factor Authentication</span>
                    <div className="flex items-center gap-2">
                      <Progress value={securitySettings.mfaEnabled ? 100 : 0} className="w-24 h-2" />
                      <span className="text-sm font-medium">
                        {securitySettings.mfaEnabled ? '20/20' : '0/20'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Password Policy</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-24 h-2" />
                      <span className="text-sm font-medium">25/30</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Encryption</span>
                    <div className="flex items-center gap-2">
                      <Progress value={100} className="w-24 h-2" />
                      <span className="text-sm font-medium">20/20</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">GDPR Compliance</span>
                    <div className="flex items-center gap-2">
                      <Progress value={100} className="w-24 h-2" />
                      <span className="text-sm font-medium">30/30</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Security Events
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-green-500' :
                          log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <div className="font-medium">{log.action}</div>
                          <div className="text-sm text-gray-600">{log.userName} • {log.resource}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getRiskColor(log.riskLevel)}`}>
                          {log.riskLevel.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mfa" className="space-y-4">
            {/* Multi-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Factor Authentication Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Multi-Factor Authentication</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      Require additional verification for all user logins
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.mfaEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => ({ ...prev, mfaEnabled: checked }))
                    }
                  />
                </div>

                {securitySettings.mfaEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>MFA Method</Label>
                      <Select
                        value={securitySettings.mfaMethod}
                        onValueChange={(value) =>
                          setSecuritySettings(prev => ({ ...prev, mfaMethod: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="authenticator">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              Authenticator App (Recommended)
                            </div>
                          </SelectItem>
                          <SelectItem value="sms">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              SMS Text Message
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Email Verification
                            </div>
                          </SelectItem>
                          <SelectItem value="biometric">
                            <div className="flex items-center gap-2">
                              <Fingerprint className="h-4 w-4" />
                              Biometric Authentication
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Select
                        value={securitySettings.sessionTimeout.toString()}
                        onValueChange={(value) =>
                          setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Length</Label>
                    <Select
                      value={securitySettings.passwordPolicy.minLength.toString()}
                      onValueChange={(value) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(value) }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 characters</SelectItem>
                        <SelectItem value="10">10 characters</SelectItem>
                        <SelectItem value="12">12 characters (Recommended)</SelectItem>
                        <SelectItem value="14">14 characters</SelectItem>
                        <SelectItem value="16">16 characters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Password Expiration (days)</Label>
                    <Select
                      value={securitySettings.passwordPolicy.expiration.toString()}
                      onValueChange={(value) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, expiration: parseInt(value) }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days (Recommended)</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">365 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gdpr" className="space-y-4">
            {/* GDPR Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  GDPR Compliance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    GDPR compliance is currently active. All data processing activities are logged and monitored.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Enable GDPR Compliance</Label>
                      <div className="text-sm text-gray-600 mt-1">
                        Activate GDPR data protection and privacy features
                      </div>
                    </div>
                    <Switch
                      checked={gdprSettings.enabled}
                      onCheckedChange={(checked) =>
                        setGDPRSettings(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>

                  {gdprSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Data Retention Period (days)</Label>
                        <Select
                          value={gdprSettings.dataRetentionPeriod.toString()}
                          onValueChange={(value) =>
                            setGDPRSettings(prev => ({ ...prev, dataRetentionPeriod: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="365">1 Year</SelectItem>
                            <SelectItem value="730">2 Years</SelectItem>
                            <SelectItem value="1095">3 Years (Recommended)</SelectItem>
                            <SelectItem value="1825">5 Years</SelectItem>
                            <SelectItem value="2555">7 Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label>Cookie Consent</Label>
                          <Switch
                            checked={gdprSettings.cookieConsent}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, cookieConsent: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Right to Erasure</Label>
                          <Switch
                            checked={gdprSettings.rightToErasure}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, rightToErasure: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Data Portability</Label>
                          <Switch
                            checked={gdprSettings.dataPortability}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, dataPortability: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Privacy by Design</Label>
                          <Switch
                            checked={gdprSettings.privacyByDesign}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, privacyByDesign: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Data Processing Logs</Label>
                          <Switch
                            checked={gdprSettings.dataProcessingLogs}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, dataProcessingLogs: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Consent Management</Label>
                          <Switch
                            checked={gdprSettings.consentManagement}
                            onCheckedChange={(checked) =>
                              setGDPRSettings(prev => ({ ...prev, consentManagement: checked }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            {/* Audit Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Audit Trail
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportAuditLogs}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAuditLogs([])}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              log.status === 'success' ? 'bg-green-500' :
                              log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <div className="font-medium">{log.action}</div>
                              <div className="text-sm text-gray-600">{log.userName} • {log.resource}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getRiskColor(log.riskLevel).replace('text-', 'bg-').replace('-600', '-100')}>
                              {log.riskLevel.toUpperCase()}
                            </Badge>
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">{log.details}</div>

                        <div className="text-xs text-gray-500">
                          IP: {log.ipAddress} • User Agent: {log.userAgent.substring(0, 50)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threats" className="space-y-4">
            {/* Security Threats */}
            <Card>
              <CardHeader>
                <CardTitle>Security Threat Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityThreats.map((threat) => (
                    <Card key={threat.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getStatusColor(threat.severity)}>
                                {threat.severity.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(threat.status)}>
                                {threat.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="font-medium text-lg">{threat.type.replace(/_/g, ' ').toUpperCase()}</div>
                            <div className="text-sm text-gray-600">Source: {threat.source}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(threat.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 mb-3">{threat.description}</div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Mitigation Actions:</div>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {threat.mitigationActions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>

                        {threat.status === 'active' && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => resolveThreat(threat.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Mark as Resolved
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {/* Compliance Checks */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceChecks.map((check) => (
                    <Card key={check.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-blue-100 text-blue-800">
                                {check.standard}
                              </Badge>
                              <Badge className={getStatusColor(check.status)}>
                                {check.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="font-medium">{check.requirement}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runComplianceCheck(check.standard)}
                            className="gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Check Now
                          </Button>
                        </div>

                        <div className="text-sm text-gray-700 mb-3">{check.details}</div>

                        <div className="text-xs text-gray-500 mb-3">
                          Last Check: {new Date(check.lastCheck).toLocaleString()} •
                          Next Check: {new Date(check.nextCheck).toLocaleString()}
                        </div>

                        {check.remediationActions.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-orange-600">Remediation Actions:</div>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {check.remediationActions.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};