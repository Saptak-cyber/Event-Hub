import Stripe from 'stripe';

let stripe;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️  Stripe not configured. Payment features will be disabled.');
}

export default stripe;
