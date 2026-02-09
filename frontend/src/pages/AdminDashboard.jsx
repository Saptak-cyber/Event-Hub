import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, TrendingUp, Edit, Trash2, Eye, BarChart3, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events/my/organized');
      setEvents(data.data);
      
      const totalRegistrations = data.data.reduce((sum, event) => sum + event.registeredCount, 0);
      const upcomingEvents = data.data.filter(e => e.status === 'upcoming').length;
      const totalRevenue = data.data.reduce((sum, event) => {
        return sum + (event.isPaid ? event.price * event.registeredCount : 0);
      }, 0);
      
      setStats({
        totalEvents: data.data.length,
        upcomingEvents,
        totalRegistrations,
        totalRevenue
      });
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const statusColors = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ongoing: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and registrations</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/analytics">
              <Button variant="secondary" className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Button>
            </Link>
            <Link to="/admin/events/create">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Event
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Upcoming', value: stats.upcomingEvents, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Registrations', value: stats.totalRegistrations, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">My Events</h2>
            </div>

            {events.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No events yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first event to get started
                </p>
                <Link to="/admin/events/create">
                  <Button>Create Event</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Registrations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map((event, index) => (
                      <motion.tr
                        key={event._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden mr-4">
                              <img
                                src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200'}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium line-clamp-1">
                                {event.title}
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {event.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(event.dateTime), 'PPP')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(event.dateTime), 'p')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn("border capitalize", statusColors[event.status])}>
                            {event.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {event.registeredCount} / {event.capacity}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/events/${event._id}`}
                              className="text-blue-500 hover:text-blue-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/admin/events/edit/${event._id}`}
                              className="text-indigo-500 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/admin/events/${event._id}/registrations`}
                              className="text-green-500 hover:text-green-600 transition-colors"
                              title="View Registrations"
                            >
                              <Users className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;

