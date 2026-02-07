import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Calendar, DollarSign, TrendingUp, Award,
  Download, RefreshCw, CheckCircle, Search, Trash2, Shield
} from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: 'all',
    verified: 'all'
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
      setRevenue(revenueRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role !== 'all') params.append('role', userFilters.role);
      if (userFilters.verified !== 'all') params.append('verified', userFilters.verified);
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

  const handleUserVerifiedFilter = (e) => {
    setUserFilters(prev => ({ ...prev, verified: e.target.value }));
    setUserPagination(prev => ({ ...prev, page: 1 }));
  };

  const updateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(user => (
        user._id === userId ? { ...user, role } : user
      )));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user role');
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
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
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
    } catch (error) {
      alert('Export failed: ' + error.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500 mt-1">Platform-wide insights and statistics</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">+{analytics.growth.newUsers} this period</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalEvents}</p>
                <p className="text-sm text-blue-600 mt-1">+{analytics.growth.newEvents} this period</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${analytics.overview.totalRevenue}</p>
                <p className="text-sm text-gray-500 mt-1">Avg: ${analytics.overview.averageRevenuePerEvent}/event</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalRegistrations}</p>
                <p className="text-sm text-orange-600 mt-1">+{analytics.growth.newRegistrations} this period</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Registration Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.registrationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Registrations" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Category</h3>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Events by Registrations</h3>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topEvents.slice(0, 10).map((event, index) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      } font-semibold text-sm`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{event.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(event.dateTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {event.registrationCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Active Events</h4>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.activeEvents}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Paid Registrations</h4>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.paidRegistrations}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Check-in Rate</h4>
            <p className="text-2xl font-bold text-gray-900">{analytics.checkInRate}%</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-500">Manage roles and accounts</p>
            </div>
            <div className="text-sm text-gray-500">
              Total Users: <span className="font-medium text-gray-900">{userPagination.total}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userFilters.search}
                onChange={handleUserSearch}
                placeholder="Search by name or email"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={userFilters.role}
              onChange={handleUserRoleFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={userFilters.verified}
              onChange={handleUserVerifiedFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {usersLoading ? (
            <div className="py-8 text-center">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.stats?.registrationCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {userPagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setUserPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={userPagination.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {userPagination.page} of {userPagination.pages}
              </span>
              <button
                onClick={() => setUserPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))}
                disabled={userPagination.page === userPagination.pages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => exportData('users')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export Users
            </button>
            <button
              onClick={() => exportData('events')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export Events
            </button>
            <button
              onClick={() => exportData('registrations')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Export Registrations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
