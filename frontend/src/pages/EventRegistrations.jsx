import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Mail, Phone, Download } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EventRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventResponse = await api.get(`/events/${id}`);
      setEvent(eventResponse.data.data);

      // Fetch registrations
      const regResponse = await api.get(`/registrations/event/${id}`);
      setRegistrations(regResponse.data.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await api.put(`/registrations/${registrationId}/checkin`);
      toast.success('Attendee checked in successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to check in attendee');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Registration Date', 'Check-in Status'];
    const rows = filteredRegistrations.map(reg => [
      reg.user.name,
      reg.user.email,
      reg.user.phone || 'N/A',
      reg.status,
      format(new Date(reg.registeredAt), 'PPP'),
      reg.checkInStatus ? 'Checked In' : 'Not Checked In'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title}-registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    return reg.status === filter;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    waitlist: registrations.filter(r => r.status === 'waitlist').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
    checkedIn: registrations.filter(r => r.checkInStatus).length
  };

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
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Event Info */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event?.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{format(new Date(event?.dateTime), 'PPP')}</span>
                <span>•</span>
                <span>{event?.location}</span>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Waitlist</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.waitlist}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Checked In</p>
            <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'confirmed', 'waitlist', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f} {f !== 'all' && `(${registrations.filter(r => r.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="card overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No registrations found
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No one has registered yet' 
                  : `No ${filter} registrations`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map(registration => (
                    <tr key={registration._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              src={registration.user.avatar || 'https://ui-avatars.com/api/?name=' + registration.user.name}
                              alt={registration.user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {registration.user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{registration.user.email}</span>
                        </div>
                        {registration.user.phone && (
                          <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{registration.user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${statusColors[registration.status]} capitalize`}>
                          {registration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(registration.registeredAt), 'PPP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.checkInStatus ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-5 h-5 mr-1" />
                            <span className="text-sm">Checked In</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-5 h-5 mr-1" />
                            <span className="text-sm">Not Checked In</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {registration.status === 'confirmed' && !registration.checkInStatus && (
                          <button
                            onClick={() => handleCheckIn(registration._id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Check In
                          </button>
                        )}
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

export default EventRegistrations;

