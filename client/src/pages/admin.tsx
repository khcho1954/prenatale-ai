import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  FileText,
  CreditCard,
  Activity
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is admin
  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery({
    queryKey: ['/api/admin/check'],
    enabled: isAuthenticated,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!adminCheckLoading && (!isAuthenticated || !adminCheck?.isAdmin)) {
      setLocation('/');
    }
  }, [adminCheckLoading, isAuthenticated, adminCheck, setLocation]);

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !adminCheck?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, content, and system settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewSection />
          </TabsContent>

          <TabsContent value="users">
            <UsersSection />
          </TabsContent>

          <TabsContent value="content">
            <ContentSection />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponsSection />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsSection />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsSection />
          </TabsContent>

          <TabsContent value="logs">
            <LogsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewSection() {
  const { data: storyAnalytics } = useQuery({
    queryKey: ['/api/admin/stories/analytics'],
  });

  const { data: subscriptionAnalytics } = useQuery({
    queryKey: ['/api/admin/subscriptions/analytics'],
  });

  const { data: apiUsageStats } = useQuery({
    queryKey: ['/api/admin/api-usage'],
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
          <BookOpen className="h-4 w-4 text-lavender" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{storyAnalytics?.total || 0}</div>
          <p className="text-xs text-gray-600">
            {storyAnalytics?.userGenerated || 0} user-generated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-mint" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscriptionAnalytics?.active || 0}</div>
          <p className="text-xs text-gray-600">
            {subscriptionAnalytics?.total || 0} total subscribers
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-coral" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(Number(subscriptionAnalytics?.monthlyRevenue) || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-600">
            ${(Number(subscriptionAnalytics?.yearlyRevenue) || 0).toFixed(2)} yearly
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Usage Cost</CardTitle>
          <BarChart3 className="h-4 w-4 text-soft-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(Number(apiUsageStats?.totalCost) || 0).toFixed(4)}
          </div>
          <p className="text-xs text-gray-600">
            {apiUsageStats?.totalRequests || 0} requests
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch })
      });
      const response = await apiRequest('GET', `/api/admin/users?${params}`);
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Baby Name</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.babyName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.language === 'ko' ? 'secondary' : 'default'}>
                        {user.language?.toUpperCase() || 'EN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContentSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: stories, isLoading } = useQuery({
    queryKey: ['/api/admin/stories', { page, search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      const response = await apiRequest('GET', `/api/admin/stories?${params}`);
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-md">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stories ({stories?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories?.stories?.map((story: any) => (
                  <TableRow key={story.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{story.titleEn || story.titleKo}</div>
                        <div className="text-sm text-gray-500">{story.titleKo || story.titleEn}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={story.isCreated ? 'secondary' : 'default'}>
                        {story.isCreated ? 'User Created' : 'Daily Story'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={story.status === 'published' ? 'default' : 'secondary'}>
                        {story.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CouponsSection() {
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['/api/admin/coupons', { page }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/coupons?page=${page}&limit=20`);
      return response.json();
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const response = await apiRequest('POST', '/api/admin/coupons', couponData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Coupon created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create coupon', variant: 'destructive' });
    },
  });

  const createBulkCouponsMutation = useMutation({
    mutationFn: async (bulkData: any) => {
      const response = await apiRequest('POST', '/api/admin/coupons/bulk', bulkData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Bulk coupons created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsBulkCreateModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create bulk coupons', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsBulkCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            대량 생성
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            쿠폰 생성
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupons ({coupons?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>쿠폰 코드</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>업그레이드 유형</TableHead>
                  <TableHead>플랜 기간</TableHead>
                  <TableHead>사용량</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>유효 기간</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.coupons?.map((coupon: any) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono">{coupon.code}</TableCell>
                    <TableCell>{coupon.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.upgradeType === 'duration_based' ? '기간 기반' : '만료일 기반'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.upgradeType === 'duration_based' ? (
                        <Badge variant="outline">
                          {coupon.planDuration === '1_month' ? '1개월' :
                           coupon.planDuration === '3_months' ? '3개월' :
                           coupon.planDuration === '6_months' ? '6개월' :
                           coupon.planDuration === '12_months' ? '12개월' : coupon.planDuration}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.currentUses || 0} / {coupon.maxUses || '∞'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 쿠폰 생성</DialogTitle>
          </DialogHeader>
          <CouponForm onSubmit={createCouponMutation.mutate} />
        </DialogContent>
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog open={isBulkCreateModalOpen} onOpenChange={setIsBulkCreateModalOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>쿠폰 대량 생성</DialogTitle>
          </DialogHeader>
          <BulkCouponForm onSubmit={createBulkCouponsMutation.mutate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CouponForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    upgradeType: 'duration_based',
    planDuration: '1_month',
    planExpiryDate: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      // Code will be generated automatically by the server
    };
    
    onSubmit(submitData);
  };

  const getTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getDefaultValidFrom = () => {
    return new Date().toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          <strong>자동 생성:</strong> 쿠폰 코드는 자동으로 생성됩니다 (PRENA-XXXXXX 형식)
        </p>
      </div>

      <div>
        <Label htmlFor="name">쿠폰 이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="예: 1개월 프레나 플랜 무료 체험"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="쿠폰 설명을 입력하세요..."
        />
      </div>

      <div className="space-y-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>프레나 플랜 제공 방식:</strong> 사용자가 쿠폰 적용 시 프레나 플랜이 언제까지 유효한지 결정
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="upgradeType">업그레이드 유형</Label>
            <Select value={formData.upgradeType} onValueChange={(value) => setFormData({ ...formData, upgradeType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-md">
                <SelectItem value="duration_based">사용자 등록 시점부터 기간</SelectItem>
                <SelectItem value="expiry_based">관리자 지정 만료일까지</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.upgradeType === 'duration_based' 
                ? '사용자가 쿠폰 사용 시점부터 선택한 기간만큼 프레나 플랜 제공' 
                : '사용자가 쿠폰 사용 시점부터 관리자가 지정한 만료일까지 프레나 플랜 제공'}
            </p>
          </div>
          {formData.upgradeType === 'duration_based' && (
            <div>
              <Label htmlFor="planDuration">플랜 기간</Label>
              <Select value={formData.planDuration} onValueChange={(value) => setFormData({ ...formData, planDuration: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  <SelectItem value="1_month">1개월</SelectItem>
                  <SelectItem value="3_months">3개월</SelectItem>
                  <SelectItem value="6_months">6개월</SelectItem>
                  <SelectItem value="12_months">12개월</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="maxUses">최대 사용 횟수 (선택사항)</Label>
        <Input
          id="maxUses"
          type="number"
          value={formData.maxUses}
          onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
          placeholder="무제한은 비워두세요"
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>쿠폰 사용 가능 기간 설정:</strong> 사용자가 쿠폰 코드를 입력할 수 있는 기간입니다. 
          업그레이드 유형과 관계없이 모든 쿠폰에 적용됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">유효 시작일</Label>
          <Input
            id="validFrom"
            type="datetime-local"
            value={formData.validFrom || getDefaultValidFrom()}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="validUntil">유효 종료일</Label>
          <Input
            id="validUntil"
            type="datetime-local"
            value={formData.validUntil || getTomorrowDateTime()}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        프레나 플랜 쿠폰 생성
      </Button>
    </form>
  );
}

function BulkCouponForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    upgradeType: 'duration_based',
    planDuration: '1_month',
    planExpiryDate: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    quantity: 10,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      // Code will be generated automatically by the server
    };
    
    onSubmit(submitData);
  };

  const getTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getDefaultValidFrom = () => {
    return new Date().toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          <strong>자동 생성:</strong> 각 쿠폰마다 고유한 코드가 자동으로 생성됩니다 (PRENA-XXXXXX 형식)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">쿠폰 이름</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 1개월 프레나 플랜 무료 체험"
            required
          />
        </div>
        <div>
          <Label htmlFor="quantity">생성 개수</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            min="1"
            max="100"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="쿠폰 설명을 입력하세요..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="upgradeType">업그레이드 유형</Label>
          <Select value={formData.upgradeType} onValueChange={(value) => setFormData({ ...formData, upgradeType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-md">
              <SelectItem value="duration_based">사용자 등록 시점부터 기간</SelectItem>
              <SelectItem value="expiry_based">관리자 지정 만료일까지</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.upgradeType === 'duration_based' && (
          <div>
            <Label htmlFor="planDuration">플랜 기간</Label>
            <Select value={formData.planDuration} onValueChange={(value) => setFormData({ ...formData, planDuration: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-md">
                <SelectItem value="1_month">1개월</SelectItem>
                <SelectItem value="3_months">3개월</SelectItem>
                <SelectItem value="6_months">6개월</SelectItem>
                <SelectItem value="12_months">12개월</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {formData.upgradeType === 'expiry_based' && (
          <div>
            <Label htmlFor="planExpiryDate">프레나 플랜 만료일</Label>
            <Input
              id="planExpiryDate"
              type="datetime-local"
              value={formData.planExpiryDate || ''}
              onChange={(e) => setFormData({ ...formData, planExpiryDate: e.target.value })}
              required
            />
            <p className="text-xs text-green-600 mt-1">
              사용자가 쿠폰 사용 시 이 날짜까지 프레나 플랜 제공
            </p>
          </div>
        )}
        {formData.upgradeType === 'expiry_based' && (
          <div>
            <Label htmlFor="planExpiryDate">프레나 플랜 만료일</Label>
            <Input
              id="planExpiryDate"
              type="datetime-local"
              value={formData.planExpiryDate || ''}
              onChange={(e) => setFormData({ ...formData, planExpiryDate: e.target.value })}
              required
            />
            <p className="text-xs text-green-600 mt-1">
              사용자가 쿠폰 사용 시 이 날짜까지 프레나 플랜 제공
            </p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="maxUses">쿠폰당 최대 사용 횟수 (선택사항)</Label>
        <Input
          id="maxUses"
          type="number"
          value={formData.maxUses}
          onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
          placeholder="무제한은 비워두세요"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">유효 시작일</Label>
          <Input
            id="validFrom"
            type="datetime-local"
            value={formData.validFrom || getDefaultValidFrom()}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="validUntil">유효 종료일</Label>
          <Input
            id="validUntil"
            type="datetime-local"
            value={formData.validUntil || getTomorrowDateTime()}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {formData.quantity}개 프레나 플랜 쿠폰 생성
      </Button>
    </form>
  );
}

function SubscriptionsSection() {
  const [page, setPage] = useState(1);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions', { page }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/subscriptions?page=${page}&limit=20`);
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscription Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({subscriptions?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.subscriptions?.map((subscription: any) => (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.user?.username || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscription.planType.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.autoRenew ? 'default' : 'secondary'}>
                        {subscription.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSection() {
  const [dateRange, setDateRange] = useState('7d');

  const { data: apiUsage } = useQuery({
    queryKey: ['/api/admin/api-usage', { dateRange }],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiRequest('GET', `/api/admin/api-usage?${params}`);
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-md">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiUsage?.byProvider?.map((provider: any) => (
                <div key={provider.provider} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-lavender rounded-full"></div>
                    <span className="capitalize">{provider.provider}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${provider.cost.toFixed(4)}</div>
                    <div className="text-sm text-gray-500">{provider.requests} requests</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiUsage?.byOperation?.map((operation: any) => (
                <div key={operation.operation} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-mint rounded-full"></div>
                    <span className="capitalize">{operation.operation.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${operation.cost.toFixed(4)}</div>
                    <div className="text-sm text-gray-500">{operation.requests} requests</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogsSection() {
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['/api/admin/logs', { page }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/logs?page=${page}&limit=20`);
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Logs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({logs?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-lavender border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.admin?.user?.username || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.targetType} #{log.targetId}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}