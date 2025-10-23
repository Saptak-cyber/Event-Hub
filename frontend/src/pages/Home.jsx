import { Link } from 'react-router-dom';
import { Calendar, Users, Bell, Shield, ArrowRight } from 'lucide-react';
import DarkVeil from '../components/DarkVeil';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Welcome to EventHub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Discover, Register, and Manage Events Seamlessly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/events"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                Browse Events
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors text-lg border-2 border-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose EventHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to organize and attend events in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Easy Event Management
              </h3>
              <p className="text-gray-600">
                Create and manage events with our intuitive interface
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                RSVP & Registration
              </h3>
              <p className="text-gray-600">
                Quick and easy event registration for attendees
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Reminders
              </h3>
              <p className="text-gray-600">
                Never miss an event with automated email reminders
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600">
                Your data is safe with our secure platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up as a user or event organizer
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Browse Events
              </h3>
              <p className="text-gray-600">
                Discover events that match your interests
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Register & Attend
              </h3>
              <p className="text-gray-600">
                RSVP to events and receive reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of users managing their events efficiently
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Sign Up Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;