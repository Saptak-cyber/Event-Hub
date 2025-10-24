import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User as UserIcon,
  Tag,
  DollarSign,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    if (isAuthenticated) {
      checkRegistrationStatus();
    }
  }, [id, isAuthenticated]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.data);
    } catch (error) {
      toast.error('Failed to load event details');
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const { data } = await api.get('/registrations/my');
      const registered = data.data.some(reg => reg.event._id === id && reg.status !== 'cancelled');
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for events');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      await api.post(`/registrations/${id}`);
      navigate('/dashboard');
      toast.success('Successfully registered for the event!');
      setIsRegistered(true);
      fetchEventDetails(); // Refresh event details
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button onClick={() => navigate('/events')} className="btn-primary">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registeredCount;
  const isFull = spotsLeft <= 0;

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const categoryColors = {
    conference: 'bg-purple-100 text-purple-800',
    workshop: 'bg-indigo-100 text-indigo-800',
    seminar: 'bg-blue-100 text-blue-800',
    webinar: 'bg-cyan-100 text-cyan-800',
    meetup: 'bg-pink-100 text-pink-800',
    networking: 'bg-orange-100 text-orange-800',
    social: 'bg-yellow-100 text-yellow-800',
    sports: 'bg-green-100 text-green-800',
    cultural: 'bg-red-100 text-red-800',
    tech: 'bg-slate-100 text-slate-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Events
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner Image */}
            <div className="card overflow-hidden">
              <img
                src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
                alt={event.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Event Info */}
            <div className="card p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge ${statusColors[event.status]}`}>
                  {event.status}
                </span>
                <span className={`badge ${categoryColors[event.category]}`}>
                  {event.category}
                </span>
                {event.isPaid && (
                  <span className="badge bg-green-100 text-green-800">
                    Paid Event
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>

              {event.requirements && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">Requirements</h3>
                  <p className="text-sm text-yellow-700">{event.requirements}</p>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Registration Card */}
            <div className="card p-6 sticky top-24">
              {event.isPaid && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price</span>
                    <div className="flex items-center text-3xl font-bold text-primary-600">
                      <DollarSign className="w-6 h-6" />
                      {event.price}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(event.dateTime), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(event.dateTime), 'p')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium text-gray-900">
                      {event.registeredCount} / {event.capacity} registered
                    </p>
                    {!isFull && (
                      <p className="text-sm text-green-600 mt-1">
                        {spotsLeft} spots left
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <UserIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Organizer</p>
                    <p className="font-medium text-gray-900">
                      {event.organizer.name}
                    </p>
                  </div>
                </div>
              </div>

              {isRegistered ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">You're registered!</span>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || isFull || event.status !== 'upcoming'}
                  className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? (
                    'Registering...'
                  ) : isFull ? (
                    event.allowWaitlist ? 'Join Waitlist' : 'Event Full'
                  ) : event.status !== 'upcoming' ? (
                    'Registration Closed'
                  ) : (
                    'Register Now'
                  )}
                </button>
              )}

              {!isAuthenticated && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  Please login to register
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

