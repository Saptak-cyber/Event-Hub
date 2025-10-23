import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
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

  const spotsLeft = event.capacity - event.registeredCount;
  const isAlmostFull = spotsLeft <= event.capacity * 0.2 && spotsLeft > 0;

  return (
    <Link to={`/events/${event._id}`} className="block">
      <div className="card overflow-hidden hover:scale-105 transition-transform duration-300">
        {/* Banner Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <span className={`badge ${statusColors[event.status]}`}>
              {event.status}
            </span>
          </div>
          <div className="absolute top-4 left-4">
            <span className={`badge ${categoryColors[event.category]}`}>
              {event.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span>{format(new Date(event.dateTime), 'PPP')}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>{format(new Date(event.dateTime), 'p')}</span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary-600" />
              <span>
                {event.registeredCount} / {event.capacity} registered
              </span>
            </div>
          </div>

          {/* Availability indicator */}
          {spotsLeft > 0 ? (
            <div className="mt-4">
              {isAlmostFull ? (
                <p className="text-orange-600 text-sm font-medium">
                  Only {spotsLeft} spots left!
                </p>
              ) : (
                <p className="text-green-600 text-sm font-medium">
                  {spotsLeft} spots available
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-red-600 text-sm font-medium">Event Full</p>
            </div>
          )}

          {event.isPaid && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-lg font-bold text-primary-600">
                ${event.price}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;

