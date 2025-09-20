import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  Shield,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ComplianceMetric {
  id: string;
  name: string;
  category: 'security' | 'privacy' | 'financial' | 'operational';
  status: 'compliant' | 'non-compliant' | 'warning' | 'pending';
  score: number;
  maxScore: number;
  lastAssessed: Date;
  nextAssessment: Date;
  requirements: {
    id: string;
    name: string;
    status: 'met' | 'not-met' | 'partial';
    description: string;
    evidence?: string[];
  }[];
  trend: 'improving' | 'declining' | 'stable';
}

interface ComplianceReport {
  id: string;
  name: string;
  type: 'audit' | 'assessment' | 'review' | 'certification';
  period: {
    start: Date;
    end: Date;
  };
  status: 'draft' | 'in-progress' | 'completed' | 'approved';
  overallScore: number;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  generatedBy: string;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface ComplianceReportingProps {
  propertyGroupId?: string;
  onGenerateReport?: (type: string, filters: any) => void;
  onExportReport?: (reportId: string, format: string) => void;
}

// Mock data for demonstration
const mockComplianceMetrics: ComplianceMetric[] = [
  {
    id: 'gdpr-1',
    name: 'GDPR Compliance',
    category: 'privacy',
    status: 'compliant',
    score: 95,
    maxScore: 100,
    lastAssessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextAssessment: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    requirements: [
      { id: 'gdpr-1-1', name: 'Data Consent Management', status: 'met', description: 'Proper consent collection and management' },
      { id: 'gdpr-1-2', name: 'Right to be Forgotten', status: 'met', description: 'Data deletion capabilities implemented' },
      { id: 'gdpr-1-3', name: 'Data Portability', status: 'partial', description: 'Export functionality needs enhancement' }
    ],
    trend: 'improving'
  },
  {
    id: 'pci-1',
    name: 'PCI DSS Compliance',
    category: 'security',
    status: 'warning',
    score: 78,
    maxScore: 100,
    lastAssessed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    nextAssessment: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    requirements: [
      { id: 'pci-1-1', name: 'Secure Network', status: 'met', description: 'Firewall and network security configured' },
      { id: 'pci-1-2', name: 'Vulnerability Management', status: 'not-met', description: 'Regular vulnerability scans required' },
      { id: 'pci-1-3', name: 'Access Control', status: 'partial', description: 'Multi-factor authentication needs implementation' }
    ],
    trend: 'declining'
  },
  {
    id: 'sox-1',
    name: 'SOX Compliance',
    category: 'financial',
    status: 'compliant',
    score: 92,
    maxScore: 100,
    lastAssessed: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    nextAssessment: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    requirements: [
      { id: 'sox-1-1', name: 'Financial Controls', status: 'met', description: 'Internal controls documented and tested' },
      { id: 'sox-1-2', name: 'Audit Trail', status: 'met', description: 'Complete audit logging implemented' },
      { id: 'sox-1-3', name: 'Segregation of Duties', status: 'met', description: 'Proper role separation enforced' }
    ],
    trend: 'stable'
  }
];

const mockComplianceReports: ComplianceReport[] = [
  {
    id: 'report-1',
    name: 'Q4 2024 Compliance Assessment',
    type: 'assessment',
    period: {
      start: startOfMonth(subMonths(new Date(), 3)),
      end: endOfMonth(subMonths(new Date(), 1))
    },
    status: 'completed',
    overallScore: 88,
    findings: { critical: 0, high: 2, medium: 5, low: 8 },
    generatedBy: 'Compliance Officer',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    approvedBy: 'Chief Risk Officer',
    approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'report-2',
    name: 'Annual Security Audit 2024',
    type: 'audit',
    period: {
      start: new Date(2024, 0, 1),
      end: new Date(2024, 11, 31)
    },
    status: 'in-progress',
    overallScore: 85,
    findings: { critical: 1, high: 3, medium: 7, low: 12 },
    generatedBy: 'External Auditor',
    generatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return 'text-green-600 bg-green-50 border-green-200';
    case 'non-compliant': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'non-compliant': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
    default: return null;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'security': return 'bg-red-100 text-red-800';
    case 'privacy': return 'bg-blue-100 text-blue-800';
    case 'financial': return 'bg-green-100 text-green-800';
    case 'operational': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const ComplianceReporting: React.FC<ComplianceReportingProps> = ({
  propertyGroupId,
  onGenerateReport,
  onExportReport
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState<ComplianceMetric | null>(null);
  const [reportType, setReportType] = useState('assessment');
  const [reportPeriod, setReportPeriod] = useState('quarterly');

  // Filter metrics based on selected filters
  const filteredMetrics = useMemo(() => {
    return mockComplianceMetrics.filter(metric => {
      const matchesCategory = selectedCategory === 'all' || metric.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || metric.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [selectedCategory, selectedStatus]);

  // Calculate overall compliance score
  const overallScore = useMemo(() => {
    if (filteredMetrics.length === 0) return 0;
    const totalScore = filteredMetrics.reduce((sum, metric) => sum + metric.score, 0);
    const maxTotalScore = filteredMetrics.reduce((sum, metric) => sum + metric.maxScore, 0);
    return Math.round((totalScore / maxTotalScore) * 100);
  }, [filteredMetrics]);

  // Calculate compliance status distribution
  const statusDistribution = useMemo(() => {
    const distribution = { compliant: 0, 'non-compliant': 0, warning: 0, pending: 0 };
    filteredMetrics.forEach(metric => {
      distribution[metric.status as keyof typeof distribution]++;
    });
    return distribution;
  }, [filteredMetrics]);

  const handleGenerateReport = () => {
    const filters = {
      category: selectedCategory,
      status: selectedStatus,
      type: reportType,
      period: reportPeriod,
      propertyGroupId
    };

    if (onGenerateReport) {
      onGenerateReport(reportType, filters);
    } else {
      console.log('Generating compliance report with filters:', filters);
    }
  };

  const handleExportReport = (reportId: string, format: string) => {
    if (onExportReport) {
      onExportReport(reportId, format);
    } else {
      console.log(`Exporting report ${reportId} in ${format} format`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{overallScore}%</div>
            <div className="text-sm text-muted-foreground">Overall Compliance</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusDistribution.compliant}</div>
            <div className="text-sm text-muted-foreground">Compliant</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusDistribution.warning}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusDistribution['non-compliant']}</div>
            <div className="text-sm text-muted-foreground">Non-Compliant</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metrics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="metrics">Compliance Metrics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Compliance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMetrics.map((metric) => (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedMetric(metric)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getStatusIcon(metric.status)}
                            {metric.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(metric.category)}>
                              {metric.category}
                            </Badge>
                            {getTrendIcon(metric.trend)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <span className="font-semibold">{metric.score}/{metric.maxScore}</span>
                      </div>

                      <Progress value={(metric.score / metric.maxScore) * 100} />

                      <Badge className={`${getStatusColor(metric.status)} border w-full justify-center`}>
                        {metric.status.replace('-', ' ').toUpperCase()}
                      </Badge>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Last assessed: {format(metric.lastAssessed, 'MMM dd, yyyy')}</div>
                        <div>Next assessment: {format(metric.nextAssessment, 'MMM dd, yyyy')}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="space-y-4">
                {mockComplianceReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <h3 className="font-semibold">{report.name}</h3>
                            <Badge variant="outline">{report.type}</Badge>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Period:</span>
                              <div>{format(report.period.start, 'MMM yyyy')} - {format(report.period.end, 'MMM yyyy')}</div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Overall Score:</span>
                              <div className="font-semibold">{report.overallScore}%</div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Findings:</span>
                              <div className="flex gap-1">
                                <Badge variant="destructive">{report.findings.critical}</Badge>
                                <Badge variant="secondary">{report.findings.high}</Badge>
                                <Badge variant="outline">{report.findings.medium}</Badge>
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Generated:</span>
                              <div>{format(report.generatedAt, 'MMM dd, yyyy')}</div>
                            </div>
                          </div>

                          {report.approvedBy && (
                            <div className="mt-2 text-sm text-green-600">
                              ✓ Approved by {report.approvedBy} on {format(report.approvedAt!, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedMetric(null)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExportReport(report.id, 'pdf')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Compliance Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assessment">Compliance Assessment</SelectItem>
                          <SelectItem value="audit">Security Audit</SelectItem>
                          <SelectItem value="review">Quarterly Review</SelectItem>
                          <SelectItem value="certification">Certification Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Period</Label>
                      <Select value={reportPeriod} onValueChange={setReportPeriod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Report Generation</AlertTitle>
                    <AlertDescription>
                      This will generate a comprehensive compliance report based on current metrics and historical data.
                      The process may take several minutes to complete.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleGenerateReport} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Compliance Report
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Metric Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedMetric.name} - Detailed View</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMetric(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Badge className={getCategoryColor(selectedMetric.category)}>
                    {selectedMetric.category}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMetric.status)}
                    <Badge className={getStatusColor(selectedMetric.status)}>
                      {selectedMetric.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Score</Label>
                  <div className="text-lg font-semibold">{selectedMetric.score}/{selectedMetric.maxScore}</div>
                  <Progress value={(selectedMetric.score / selectedMetric.maxScore) * 100} />
                </div>
                <div>
                  <Label>Trend</Label>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(selectedMetric.trend)}
                    <span className="capitalize">{selectedMetric.trend}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="space-y-2 mt-2">
                  {selectedMetric.requirements.map((req) => (
                    <Card key={req.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{req.name}</h4>
                              <Badge variant={req.status === 'met' ? 'default' : req.status === 'partial' ? 'secondary' : 'destructive'}>
                                {req.status.replace('-', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{req.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Last Assessed</Label>
                  <div>{format(selectedMetric.lastAssessed, 'PPpp')}</div>
                </div>
                <div>
                  <Label>Next Assessment</Label>
                  <div>{format(selectedMetric.nextAssessment, 'PPpp')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};