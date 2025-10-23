import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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
      // First, check if user has Google Calendar connected
      const { data: userData } = await api.get('/auth/me');
      
      if (!userData.data.googleCalendarTokens) {
        // User needs to connect Google Calendar first
        const { data: authData } = await api.get('/auth/google/url');
        window.open(authData.authUrl, '_blank');
        toast.info('Please complete Google Calendar authorization in the new window');
        return;
      }
  
      // User has Google Calendar connected, add event
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

  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    waitlist: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">Manage your event registrations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-gray-600 text-sm mb-1">Total Registrations</p>
            <p className="text-3xl font-bold text-gray-900">{registrations.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-600 text-sm mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">
              {registrations.filter(r => r.status === 'confirmed').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-gray-600 text-sm mb-1">Waitlisted</p>
            <p className="text-3xl font-bold text-yellow-600">
              {registrations.filter(r => r.status === 'waitlist').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-gray-600 text-sm mb-1">Upcoming Events</p>
            <p className="text-3xl font-bold text-blue-600">
              {registrations.filter(r => r.event.status === 'upcoming' && r.status !== 'cancelled').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'confirmed', 'waitlist', 'upcoming', 'past'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No registrations found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't registered for any events yet" 
                : `No ${filter} events found`}
            </p>
            <Link to="/events" className="btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map(registration => (
              <div key={registration._id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Event Image */}
                  <div className="md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      // src={registration.event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                      src={'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                      alt={registration.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link 
                          to={`/events/${registration.event._id}`}
                          className="text-xl font-bold text-gray-900 hover:text-primary-600"
                        >
                          {registration.event.title}
                        </Link>
                        <div className="flex gap-2 mt-2">
                          <span className={`badge ${statusColors[registration.status]}`}>
                            {registration.status}
                          </span>
                          <span className="badge bg-gray-100 text-gray-800 capitalize">
                            {registration.event.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <span>{format(new Date(registration.event.dateTime), 'PPP')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary-600" />
                        <span>{format(new Date(registration.event.dateTime), 'p')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-primary-600" />
                        <span className="line-clamp-1">{registration.event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/events/${registration.event._id}`}
                        className="btn-secondary text-sm flex items-center space-x-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                      
                      {registration.status === 'confirmed' && !registration.addedToCalendar && (
                        <button
                          onClick={() => handleAddToCalendar(registration._id)}
                          className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Add to Calendar
                        </button>
                      )}

                      {registration.addedToCalendar && (
                        <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          ✓ Added to Calendar
                        </span>
                      )}

                      {registration.status !== 'cancelled' && registration.event.status === 'upcoming' && (
                        <button
                          onClick={() => handleCancelRegistration(registration._id)}
                          className="btn-danger text-sm flex items-center space-x-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

