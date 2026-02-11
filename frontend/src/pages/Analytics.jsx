import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Calendar, DollarSign, TrendingUp, Award,
  Download, RefreshCw, CheckCircle, Search, Trash2, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: 'all'
  });
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  useEffect(() => {
    fetchUsers();
  }, [userFilters, userPagination.page]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, revenueRes] = await Promise.all([
        api.get(`/admin/analytics?timeRange=${timeRange}`),
        api.get('/admin/revenue')
      ]);

      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role !== 'all') params.append('role', userFilters.role);
      params.append('page', userPagination.page);
      params.append('limit', userPagination.limit);

      const usersRes = await api.get(`/admin/users?${params.toString()}`);
      setUsers(usersRes.data.data);
      setUserPagination(prev => ({
        ...prev,
        pages: usersRes.data.pages,
        total: usersRes.data.total
      }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserSearch = (e) => {
    setUserFilters(prev => ({ ...prev, search: e.target.value }));
    setUserPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleUserRoleFilter = (e) => {
    setUserFilters(prev => ({ ...prev, role: e.target.value }));
    setUserPagination(prev => ({ ...prev, page: 1 }));
  };

  const updateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(user => (
        user._id === userId ? { ...user, role } : user
      )));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(user => user._id !== userId));
      setUserPagination(prev => ({ ...prev, total: Math.max(prev.total - 1, 0) }));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const exportData = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`);
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error('Export failed: ' + error.response?.data?.message);
    }
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 mb-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Platform-wide insights and statistics</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-field"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button
                onClick={fetchAnalytics}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Users',
              value: analytics.overview.totalUsers,
              change: `+${analytics.growth.newUsers}`,
              icon: Users,
              color: 'text-purple-500',
              bg: 'bg-purple-500/10'
            },
            {
              label: 'Total Events',
              value: analytics.overview.totalEvents,
              change: `+${analytics.growth.newEvents}`,
              icon: Calendar,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10'
            },
            {
              label: 'Total Revenue',
              value: `$${analytics.overview.totalRevenue}`,
              change: `Avg: $${analytics.overview.averageRevenuePerEvent}/event`,
              icon: DollarSign,
              color: 'text-green-500',
              bg: 'bg-green-500/10'
            },
            {
              label: 'Registrations',
              value: analytics.overview.totalRegistrations,
              change: `+${analytics.growth.newRegistrations}`,
              icon: TrendingUp,
              color: 'text-orange-500',
              bg: 'bg-orange-500/10'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className={cn("p-3 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.change}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Registration Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="_id" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Registrations" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, count }) => `${_id}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Top Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Events by Registrations</h3>
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Registrations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.topEvents.slice(0, 10).map((event, index) => (
                    <tr key={event._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm",
                          index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                          index === 2 ? 'bg-orange-500/20 text-orange-500' :
                          'bg-muted/50 text-muted-foreground'
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{event.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{event.category}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(event.dateTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          {event.registrationCount}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Active Events', value: analytics.overview.activeEvents },
            { label: 'Paid Registrations', value: analytics.overview.paidRegistrations },
            { label: 'Check-in Rate', value: `${analytics.checkInRate}%` }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</h4>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">Manage roles and accounts</p>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Users: <span className="font-medium text-foreground">{userPagination.total}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={userFilters.search}
                  onChange={handleUserSearch}
                  placeholder="Search by name or email"
                  className="pl-9"
                />
              </div>
              <select
                value={userFilters.role}
                onChange={handleUserRoleFilter}
                className="input-field"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="py-8 text-center">
                <Skeleton className="h-64" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Registrations</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                              alt={user.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="text-sm font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user._id, e.target.value)}
                              className="input-field text-sm py-1"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.stats?.registrationCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => deleteUser(user._id)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {userPagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  onClick={() => setUserPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={userPagination.page === 1}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {userPagination.page} of {userPagination.pages}
                </span>
                <Button
                  onClick={() => setUserPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))}
                  disabled={userPagination.page === userPagination.pages}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => exportData('users')}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                Export Users
              </Button>
              <Button
                onClick={() => exportData('events')}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <Download className="w-4 h-4" />
                Export Events
              </Button>
              <Button
                onClick={() => exportData('registrations')}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
              >
                <Download className="w-4 h-4" />
                Export Registrations
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
