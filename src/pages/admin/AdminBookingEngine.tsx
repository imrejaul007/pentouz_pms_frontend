import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import MarketingDashboard from '../../components/marketing/MarketingDashboard';
import BookingWidgetManager from '../../components/marketing/BookingWidgetManager';
import BookingEngineWidget from '../../components/booking/BookingEngineWidget';
import EnhancedBookingEngine from '../../components/booking/EnhancedBookingEngine';
import ChannelDistributionHub from '../../components/channels/ChannelDistributionHub';
import EmailCampaignManager from '../../components/marketing/EmailCampaignManager';
import PromoCodeManager from '../../components/marketing/PromoCodeManager';
import ReviewManager from '../../components/marketing/ReviewManager';

const AdminBookingEngine: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="widgets">Booking Widgets</TabsTrigger>
          <TabsTrigger value="engine">Legacy Engine</TabsTrigger>
          <TabsTrigger value="enhanced">OTA Engine</TabsTrigger>
          <TabsTrigger value="channels">Channel Distribution</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="promos">Promo Codes</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <MarketingDashboard />
        </TabsContent>

        <TabsContent value="widgets">
          <BookingWidgetManager />
        </TabsContent>

        <TabsContent value="engine">
          <BookingEngineWidget />
        </TabsContent>

        <TabsContent value="enhanced">
          <EnhancedBookingEngine mode="admin" showHeader={false} />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelDistributionHub />
        </TabsContent>

        <TabsContent value="campaigns">
          <EmailCampaignManager />
        </TabsContent>

        <TabsContent value="promos">
          <PromoCodeManager />
        </TabsContent>

        <TabsContent value="crm">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Guest CRM</h2>
            <p className="text-gray-600">Guest relationship management features coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewManager />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminBookingEngine;