import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Calendar, MapPin, Users, DollarSign, Tag } from 'lucide-react';
import api from '../utils/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
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
      const eventPayload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        bannerImage: imageFile ? undefined : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'
      };

      const { data } = await api.post('/events', eventPayload);
      const eventId = data.data._id;

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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create Event</h1>
                <p className="text-muted-foreground">Fill in the details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Image Upload */}
              <div>
                <Label>Event Banner Image</Label>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90">
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
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Annual Tech Conference 2024"
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  name="description"
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-2 input-field resize-none"
                  placeholder="Provide a detailed description of your event..."
                />
              </div>

              {/* Date, Time & Duration */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateTime">Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    name="dateTime"
                    id="dateTime"
                    required
                    value={formData.dateTime}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours) *</Label>
                  <Input
                    type="number"
                    name="duration"
                    id="duration"
                    required
                    min="0.5"
                    step="0.5"
                    value={formData.duration}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="e.g., Convention Center, New York"
                  />
                </div>
              </div>

              {/* Category & Capacity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    name="category"
                    id="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-2 input-field capitalize"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <div className="relative mt-2">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      name="capacity"
                      id="capacity"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Checkboxes */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    name="visibility"
                    id="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="mt-2 input-field"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="flex items-center space-x-6 pt-7">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Paid Event</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowWaitlist"
                      checked={formData.allowWaitlist}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Allow Waitlist</span>
                  </label>
                </div>
              </div>

              {/* Price (if paid) */}
              {formData.isPaid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="price">Price ($) *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      name="price"
                      id="price"
                      required={formData.isPaid}
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </motion.div>
              )}

              {/* Requirements */}
              <div>
                <Label htmlFor="requirements">Requirements (Optional)</Label>
                <textarea
                  name="requirements"
                  id="requirements"
                  rows={2}
                  value={formData.requirements}
                  onChange={handleChange}
                  className="mt-2 input-field resize-none"
                  placeholder="Any requirements or prerequisites for attendees..."
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="relative mt-2">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    name="tags"
                    id="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="e.g., technology, networking, innovation (comma-separated)"
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Separate tags with commas</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                </motion.div>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEvent;
