import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Gift, 
  TrendingUp, 
  Clock, 
  Award,
  ChevronRight,
  Zap,
  Percent,
  ArrowUp,
  Circle,
  Heart,
  Sparkles
} from 'lucide-react';
import { loyaltyService, LoyaltyDashboard as LoyaltyDashboardType } from '../../services/loyaltyService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const getTierColor = (tier: string) => {
  return loyaltyService.getTierColor(tier);
};

const getTierIcon = (tier: string) => {
  const iconName = loyaltyService.getTierIcon(tier);
  switch (iconName) {
    case 'Star': return <Star className="h-6 w-6" />;
    case 'Award': return <Award className="h-6 w-6" />;
    case 'TrendingUp': return <TrendingUp className="h-6 w-6" />;
    default: return <Zap className="h-6 w-6" />;
  }
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'earned': return <TrendingUp className="h-4 w-4" />;
    case 'redeemed': return <Gift className="h-4 w-4" />;
    case 'bonus': return <Star className="h-4 w-4" />;
    case 'expired': return <Clock className="h-4 w-4" />;
    default: return <Circle className="h-4 w-4" />;
  }
};

const getOfferIcon = (type: string) => {
  switch (type) {
    case 'discount': return <Percent className="h-4 w-4" />;
    case 'free_service': return <Gift className="h-4 w-4" />;
    case 'upgrade': return <ArrowUp className="h-4 w-4" />;
    case 'bonus_points': return <Star className="h-4 w-4" />;
    default: return <Circle className="h-4 w-4" />;
  }
};

export default function LoyaltyDashboard() {
  const [redeemingOffer, setRedeemingOffer] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['loyalty-dashboard'],
    queryFn: loyaltyService.getDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRedeemOffer = async (offerId: string) => {
    try {
      setRedeemingOffer(offerId);
      const result = await loyaltyService.redeemPoints(offerId);
      
      toast.success(result.message);
      
      // Refetch dashboard data to update points and transactions
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to redeem offer');
    } finally {
      setRedeemingOffer(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load loyalty dashboard</p>
        <Button 
          onClick={() => refetch()} 
          variant="secondary" 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Loyalty Dashboard
        </h1>
        <p className="text-gray-600">
          Earn points with every stay and unlock exclusive rewards
        </p>
      </div>

      {/* Points and Tier Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Points Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Points</h3>
            <div className="text-2xl font-bold text-blue-600">
              {loyaltyService.formatPoints(dashboard.user.points)}
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (dashboard.user.points / 10000) * 100)}%` 
              }}
            />
          </div>
          {dashboard.user.nextTier && (
            <p className="text-sm text-gray-600">
              {dashboard.user.pointsToNextTier} points to {dashboard.user.nextTier} tier
            </p>
          )}
        </Card>

        {/* Tier Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Tier</h3>
            <div className={`p-2 rounded-full bg-gradient-to-r ${getTierColor(dashboard.user.tier)}`}>
              {getTierIcon(dashboard.user.tier)}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 capitalize mb-2">
            {dashboard.user.tier}
          </div>
          <p className="text-sm text-gray-600">
            {loyaltyService.getTierBenefits(dashboard.user.tier)}
          </p>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate('/app/loyalty/transactions')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {dashboard.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions yet</p>
              <p className="text-sm">Your loyalty activity will appear here</p>
            </div>
          ) : (
            dashboard.recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Available Offers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Available Offers</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/loyalty/favorites')}
              className="flex items-center gap-1"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/loyalty/recommendations')}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              For You
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/app/loyalty/offers')}
            >
              View All Offers
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.availableOffers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No offers available</p>
              <p className="text-sm">Check back later for new rewards</p>
            </div>
          ) : (
            dashboard.availableOffers.slice(0, 6).map((offer) => (
              <div key={offer._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 capitalize">{offer.category}</span>
                  <span className="text-sm text-gray-500">{offer.pointsRequired} pts</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  {getOfferIcon(offer.type)}
                  <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.description}</p>
                
                {offer.type === 'discount' && (
                  <div className="mb-3">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {offer.discountPercentage ? `${offer.discountPercentage}% off` : `₹${offer.discountAmount} off`}
                    </span>
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleRedeemOffer(offer._id)}
                  disabled={redeemingOffer === offer._id}
                >
                  {redeemingOffer === offer._id ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Redeeming...
                    </>
                  ) : (
                    'Redeem'
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
