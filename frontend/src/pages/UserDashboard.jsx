import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, X, ExternalLink, Ticket, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/registrations/my');
      setRegistrations(data.data);
    } catch (error) {
      toast.error('Failed to fetch registrations');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await api.delete(`/registrations/${registrationId}`);
      toast.success('Registration cancelled successfully');
      fetchRegistrations();
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const handleAddToCalendar = async (registrationId) => {
    try {
      const { data: userData } = await api.get('/auth/me');
      
      if (!userData.data.googleCalendarTokens) {
        const { data: authData } = await api.get('/auth/google/url');
        window.open(authData.authUrl, '_blank');
        toast.info('Please complete Google Calendar authorization in the new window');
        return;
      }
  
      await api.post(`/registrations/${registrationId}/add-to-calendar`);
      toast.success('Event added to Google Calendar!');
      fetchRegistrations();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to calendar';
      toast.error(message);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return reg.event.status === 'upcoming';
    if (filter === 'past') return reg.event.status === 'completed';
    return reg.status === filter;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    upcoming: registrations.filter(r => r.event.status === 'upcoming' && r.status !== 'cancelled').length,
    attended: registrations.filter(r => r.checkInStatus).length
  };

  const statusColors = {
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    waitlist: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-64 mb-8" />
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage your event registrations</p>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Registrations', value: stats.total, icon: Calendar, color: 'text-primary' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'text-green-500' },
            { label: 'Upcoming Events', value: stats.upcoming, icon: TrendingUp, color: 'text-blue-500' },
            { label: 'Attended', value: stats.attended, icon: Ticket, color: 'text-purple-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {['all', 'confirmed', 'waitlist', 'upcoming', 'past'].map(f => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  variant={filter === f ? "default" : "secondary"}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No registrations found
              </h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' 
                  ? "You haven't registered for any events yet" 
                  : `No ${filter} events found`}
              </p>
              <Link to="/events">
                <Button>Browse Events</Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration, index) => (
              <motion.div
                key={registration._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={registration.event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                        alt={registration.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link 
                            to={`/events/${registration.event._id}`}
                            className="text-xl font-bold hover:text-primary transition-colors"
                          >
                            {registration.event.title}
                          </Link>
                          <div className="flex gap-2 mt-2">
                            <Badge className={cn("border", statusColors[registration.status])}>
                              {registration.status}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {registration.event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{format(new Date(registration.event.dateTime), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{format(new Date(registration.event.dateTime), 'p')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="line-clamp-1">{registration.event.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/events/${registration.event._id}`}>
                          <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Details
                          </Button>
                        </Link>
                        
                        {registration.status === 'confirmed' && (
                          <Link to={`/ticket/${registration._id}`}>
                            <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
                              <Ticket className="w-4 h-4" />
                              View Ticket
                            </Button>
                          </Link>
                        )}
                        
                        {registration.status === 'confirmed' && !registration.addedToCalendar && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddToCalendar(registration._id)}
                            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                          >
                            Add to Calendar
                          </Button>
                        )}

                        {registration.addedToCalendar && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            ✓ Added to Calendar
                          </Badge>
                        )}

                        {registration.status !== 'cancelled' && registration.event.status === 'upcoming' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRegistration(registration._id)}
                            className="flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

