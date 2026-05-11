import { Zap, Shield, Crown, Star } from 'lucide-react';

export const PLANS = [
  {
    id: 'monthly',
    name: 'Standard Protocol',
    duration: 'Monthly',
    price: 9999,
    priceLabel: '9,999',
    features: ['24/7 Vault Access', 'Bio-Metric Analysis', 'Standard Locker', 'General Architecture'],
    icon: Zap,
    color: 'border-white/10'
  },
  {
    id: '3months',
    name: 'Strategic cycle',
    duration: '3 Months',
    price: 24999,
    priceLabel: '24,999',
    features: ['24/7 Vault Access', 'Bio-Metric Analysis', 'Private Locker'],
    icon: Shield,
    color: 'border-brand/30',
    popular: true
  },
  {
    id: '6months',
    name: 'Architect Tier',
    duration: '6 Months',
    price: 44999,
    priceLabel: '44,999',
    features: ['24/7 Vault Access', 'Permanent Locker', 'Sauna Priority'],
    icon: Crown,
    color: 'border-brand/50'
  },
  {
    id: '12months',
    name: 'Titan Continuum',
    duration: '12 Months',
    price: 79999,
    priceLabel: '79,999',
    save: 'Best Value',
    features: ['24/7 Vault Access', 'Sauna Priority'],
    icon: Star,
    color: 'border-brand'
  }
];
