import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    duration: 2,
    location: '',
    category: 'conference',
    capacity: 50,
    visibility: 'public',
    isPaid: false,
    price: 0,
    allowWaitlist: true,
    requirements: '',
    tags: ''
  });

  const categories = [
    'conference', 'workshop', 'seminar', 'webinar', 
    'meetup', 'networking', 'social', 'sports', 'cultural', 'tech', 'other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create event
      const eventPayload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        bannerImage: imageFile ? undefined : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'
      };

      const { data } = await api.post('/events', eventPayload);
      const eventId = data.data._id;

      // Upload banner image if provided
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('banner', imageFile);

        await api.post(`/events/${eventId}/banner`, formDataImage, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      toast.success('Event created successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event';
      toast.error(message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
              <p className="text-gray-600">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Banner Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
                {imagePreview ? (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Annual Tech Conference 2024"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Provide a detailed description of your event..."
              />
            </div>

            {/* Date, Time & Duration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  id="dateTime"
                  required
                  value={formData.dateTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  required
                  min="0.5"
                  step="0.5"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                id="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Convention Center, New York"
              />
            </div>

            {/* Category & Capacity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  id="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field capitalize"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  id="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Visibility & Paid Event */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  name="visibility"
                  id="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center space-x-6 pt-7">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Paid Event</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="allowWaitlist"
                    checked={formData.allowWaitlist}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Waitlist</span>
                </label>
              </div>
            </div>

            {/* Price (if paid) */}
            {formData.isPaid && (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required={formData.isPaid}
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            )}

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                Requirements (Optional)
              </label>
              <textarea
                name="requirements"
                id="requirements"
                rows={2}
                value={formData.requirements}
                onChange={handleChange}
                className="input-field"
                placeholder="Any requirements or prerequisites for attendees..."
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                name="tags"
                id="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., technology, networking, innovation (comma-separated)"
              />
              <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

