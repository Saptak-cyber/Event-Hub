import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Phone, Lock, ArrowLeft, Save, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUser(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'password', label: 'Change Password' }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden p-0">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-8 py-12 text-primary-foreground">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center overflow-hidden ring-4 ring-primary-foreground/20">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff&size=200`}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
                  <p className="text-primary-foreground/80 mb-2">{user?.email}</p>
                  <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                      <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Event Organizer
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-card">
              <div className="px-8">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab, index) => (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      )}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'profile' ? (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleProfileSubmit}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Personal Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative mt-2">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            className="pl-10"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            className="pl-10"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            className="pl-10"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Account Type</Label>
                        <div className="mt-2 px-4 py-3 bg-muted border border-border rounded-lg text-foreground capitalize">
                          {user?.role === 'admin' ? 'Event Organizer' : 'User'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Change Password
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="pl-10"
                            placeholder="Enter current password"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="pl-10"
                            placeholder="Enter new password"
                            required
                          />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="pl-10"
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      After changing your password, you will remain logged in on this device but may be logged out of other devices.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{loading ? 'Updating...' : 'Update Password'}</span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
