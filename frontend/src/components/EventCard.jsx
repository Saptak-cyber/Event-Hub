import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ArrowRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatDate, formatCurrency } from '../lib/utils';

const EventCard = ({ event }) => {
  const { _id, title, description, dateTime, location, category, availableSeats, price, status, imageUrl } = event;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'ongoing':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Conference: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      Workshop: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      Seminar: 'bg-green-500/10 text-green-500 border-green-500/20',
      Webinar: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      Meetup: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      Concert: 'bg-red-500/10 text-red-500 border-red-500/20',
      Sports: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      Festival: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className="overflow-hidden h-full flex flex-col group hover:border-primary/50 transition-colors">
        <div className="relative overflow-hidden h-48">
          <img 
            src={imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={getStatusVariant(status)} className="capitalize">
              {status}
            </Badge>
            <Badge className={`capitalize border ${getCategoryColor(category)}`}>
              {category}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-5">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <span>{formatDate(dateTime)}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-2 text-primary" />
                <span>{availableSeats} seats left</span>
              </div>
              <div className="flex items-center font-semibold text-primary">
                {price === 0 ? (
                  <span>Free</span>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>{price}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <Button asChild className="w-full group/button">
            <Link to={`/events/${_id}`}>
              View Details
              <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default EventCard;
