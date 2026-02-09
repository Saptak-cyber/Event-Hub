import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User as UserIcon,
  Tag,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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

    if (event.isPaid && event.price > 0) {
      setShowPayment(true);
      return;
    }

    setRegistering(true);
    try {
      await api.post(`/registrations/${id}`);
      toast.success('Successfully registered for the event!');
      setIsRegistered(true);
      fetchEventDetails();
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    toast.success('Payment successful! You are now registered.');
    setIsRegistered(true);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <Button onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </motion.div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registeredCount;
  const isFull = spotsLeft <= 0;

  const statusColors = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ongoing: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const categoryColors = {
    conference: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    workshop: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    seminar: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    webinar: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    meetup: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    networking: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    social: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    sports: 'bg-green-500/10 text-green-500 border-green-500/20',
    cultural: 'bg-red-500/10 text-red-500 border-red-500/20',
    tech: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    other: 'bg-muted text-muted-foreground border-border'
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate('/events')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Events
        </motion.button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden p-0">
                <div className="relative h-96">
                  <img
                    src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={cn("border", statusColors[event.status])}>
                        {event.status}
                      </Badge>
                      <Badge className={cn("border capitalize", categoryColors[event.category])}>
                        {event.category}
                      </Badge>
                      {event.isPaid && (
                        <Badge className="border bg-green-500/10 text-green-500 border-green-500/20">
                          Paid Event
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8">
                <h1 className="text-4xl font-bold mb-4">
                  {event.title}
                </h1>

                <div className="prose max-w-none mb-6">
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {event.requirements && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6"
                  >
                    <h3 className="text-sm font-semibold text-yellow-500 mb-1">Requirements</h3>
                    <p className="text-sm text-muted-foreground">{event.requirements}</p>
                  </motion.div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-2"
                  >
                    {event.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24"
            >
              <Card className="p-6">
                {event.isPaid && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <div className="flex items-center text-3xl font-bold text-primary">
                        <DollarSign className="w-6 h-6" />
                        {event.price}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  {[
                    { icon: Calendar, label: 'Date', value: format(new Date(event.dateTime), 'PPP') },
                    { icon: Clock, label: 'Time', value: format(new Date(event.dateTime), 'p') },
                    { icon: MapPin, label: 'Location', value: event.location },
                    { icon: Users, label: 'Capacity', value: (
                      <div>
                        <p>{event.registeredCount} / {event.capacity} registered</p>
                        {!isFull && (
                          <p className="text-sm text-green-500 mt-1">
                            {spotsLeft} spots left
                          </p>
                        )}
                      </div>
                    )},
                    { icon: UserIcon, label: 'Organizer', value: event.organizer.name }
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start space-x-3"
                    >
                      <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <div className="font-medium">
                          {typeof item.value === 'string' ? item.value : item.value}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {isRegistered ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-2 text-green-500"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">You're registered!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleRegister}
                      disabled={registering || isFull || event.status !== 'upcoming'}
                      className="w-full py-3 text-lg"
                      size="lg"
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
                    </Button>
                  </motion.div>
                )}

                {!isAuthenticated && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Please login to register
                  </p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          eventId={event._id}
          eventTitle={event.title}
          amount={event.price}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default EventDetails;

