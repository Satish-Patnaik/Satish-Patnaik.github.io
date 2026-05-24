import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Mail, 
  Phone, 
  University,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  institute: string;
  service: string;
  details: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  submittedAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  registeredAt: string;
  lastLogin: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<ServiceRequest[]>([
    {
      id: 'req-001',
      firstName: 'Dr. Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@stanford.edu',
      phone: '+1-650-123-4567',
      institute: 'Stanford University',
      service: 'Single-cell Transcriptomics',
      details: 'Need analysis of 10,000 single cells from retinal tissue. Looking for cell type identification and trajectory analysis.',
      status: 'pending',
      priority: 'high',
      submittedAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'req-002',
      firstName: 'Prof. Michael',
      lastName: 'Rodriguez',
      email: 'm.rodriguez@harvard.edu',
      institute: 'Harvard Medical School',
      service: 'Multi-omics Integration',
      details: 'Integration of genomics and proteomics data from cancer samples. Need pathway analysis and biomarker identification.',
      status: 'in-progress',
      priority: 'medium',
      submittedAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-16T09:15:00Z'
    },
    {
      id: 'req-003',
      firstName: 'Dr. Emily',
      lastName: 'Watson',
      email: 'emily.watson@nih.gov',
      phone: '+1-301-555-0123',
      institute: 'NIH',
      service: 'Data Visualization',
      details: 'Need publication-ready figures for Nature submission. Volcano plots, heatmaps, and pathway diagrams.',
      status: 'completed',
      priority: 'low',
      submittedAt: '2024-01-10T16:45:00Z',
      updatedAt: '2024-01-13T11:30:00Z'
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      firstName: 'Dr. Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@stanford.edu',
      role: 'researcher',
      registeredAt: '2024-01-10T08:00:00Z',
      lastLogin: '2024-01-15T10:25:00Z'
    },
    {
      id: 'user-002',
      firstName: 'Prof. Michael',
      lastName: 'Rodriguez',
      email: 'm.rodriguez@harvard.edu',
      role: 'professor',
      registeredAt: '2024-01-08T12:30:00Z',
      lastLogin: '2024-01-16T14:20:00Z'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateRequestStatus = (requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: newStatus as any, updatedAt: new Date().toISOString() }
        : req
    ));
    toast.success(`Request status updated to ${newStatus}`);
  };

  const updateRequestPriority = (requestId: string, newPriority: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, priority: newPriority as any, updatedAt: new Date().toISOString() }
        : req
    ));
    toast.success(`Request priority updated to ${newPriority}`);
  };

  const filteredRequests = requests.filter(req => {
    const statusMatch = filterStatus === 'all' || req.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || req.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    inProgressRequests: requests.filter(r => r.status === 'in-progress').length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    totalUsers: users.length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage service requests and user accounts</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle>Service Requests ({filteredRequests.length})</CardTitle>
                <CardDescription>Manage all incoming service requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.firstName} {request.lastName}</p>
                            <p className="text-sm text-gray-600">{request.email}</p>
                            <p className="text-sm text-gray-600">{request.institute}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.service}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Request Details</DialogTitle>
                                  <DialogDescription>
                                    Request ID: {request.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Name</Label>
                                      <p>{request.firstName} {request.lastName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p>{request.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Phone</Label>
                                      <p>{request.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Institute</Label>
                                      <p>{request.institute}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Service Requested</Label>
                                    <p>{request.service}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Details</Label>
                                    <p className="text-sm text-gray-700">{request.details}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <Select 
                                        value={request.status} 
                                        onValueChange={(value) => updateRequestStatus(request.id, value)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in-progress">In Progress</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Priority</Label>
                                      <Select 
                                        value={request.priority} 
                                        onValueChange={(value) => updateRequestPriority(request.id, value)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`mailto:${request.email}?subject=Re: ${request.service} Request`)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users ({users.length})</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.registeredAt).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Pending</span>
                      <span className="font-medium">{stats.pendingRequests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>In Progress</span>
                      <span className="font-medium">{stats.inProgressRequests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed</span>
                      <span className="font-medium">{stats.completedRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Single-cell Transcriptomics</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Multi-omics Integration</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data Visualization</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}