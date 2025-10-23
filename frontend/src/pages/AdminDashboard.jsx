import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, TrendingUp, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    totalAttendees: 0
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
      
      // Calculate stats
      const totalRegistrations = data.data.reduce((sum, event) => sum + event.registeredCount, 0);
      const upcomingEvents = data.data.filter(e => e.status === 'upcoming').length;
      
      setStats({
        totalEvents: data.data.length,
        upcomingEvents,
        totalRegistrations,
        totalAttendees: totalRegistrations
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
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your events and registrations</p>
          </div>
          <Link to="/admin/events/create" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Total Events</p>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Upcoming</p>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.upcomingEvents}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Total Registrations</p>
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.totalRegistrations}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Total Attendees</p>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.totalAttendees}</p>
          </div>
        </div>

        {/* Events List */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Events</h2>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first event to get started
              </p>
              <Link to="/admin/events/create" className="btn-primary">
                Create Event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map(event => (
                    <tr key={event._id} className="hover:bg-gray-50">
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
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {event.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(event.dateTime), 'PPP')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(event.dateTime), 'p')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${statusColors[event.status]} capitalize`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {event.registeredCount} / {event.capacity}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(event.registeredCount / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/events/${event._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            to={`/admin/events/edit/${event._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <Link
                            to={`/admin/events/${event._id}/registrations`}
                            className="text-green-600 hover:text-green-900"
                            title="View Registrations"
                          >
                            <Users className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

