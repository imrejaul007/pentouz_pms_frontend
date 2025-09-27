import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { apiErrorInterceptor } from './services/apiErrorInterceptor';

// Public Pages
import HomePage from './pages/public/HomePage';
import RoomsPage from './pages/public/RoomsPage';
import RoomDetailPage from './pages/public/RoomDetailPage';
import BookingPage from './pages/public/BookingPage';
import ContactPage from './pages/public/ContactPage';
import ReviewsPage from './pages/public/ReviewsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Guest App Pages
import GuestDashboard from './pages/guest/GuestDashboard';
import GuestBookings from './pages/guest/GuestBookings';
import GuestBookingDetail from './pages/guest/GuestBookingDetail';
import GuestProfile from './pages/guest/GuestProfile';
import GuestRequests from './pages/guest/GuestRequests';
import InventoryRequests from './pages/guest/InventoryRequests';
import LoyaltyDashboard from './pages/guest/LoyaltyDashboard';
import AllOffers from './pages/guest/AllOffers';
import LoyaltyTransactions from './pages/guest/LoyaltyTransactions';
import FavoritesPage from './pages/guest/FavoritesPage';
import RecommendationsPage from './pages/guest/RecommendationsPage';
import { ContactlessGuestApp } from './components/guest/ContactlessGuestApp';
import HotelServicesDashboard from './pages/guest/HotelServicesDashboard';
import ServiceDetailsPage from './pages/guest/ServiceDetailsPage';
import ServiceBookingPage from './pages/guest/ServiceBookingPage';
import ServiceBookingConfirmation from './pages/guest/ServiceBookingConfirmation';
import MyServiceBookings from './pages/guest/MyServiceBookings';
import NotificationsDashboard from './pages/guest/NotificationsDashboard';
import DigitalKeysDashboard from './pages/guest/DigitalKeysDashboard';
import MeetUpRequestsDashboard from './pages/guest/MeetUpRequestsDashboard';
import GuestBillingHistory from './pages/guest/GuestBillingHistory';
import GuestFeedback from './pages/guest/GuestFeedback';
import GuestDocuments from './pages/guest/GuestDocuments';
import ProfileSettings from './pages/guest/ProfileSettings';
import PreferencesSettings from './pages/guest/PreferencesSettings';
import PrivacySettings from './pages/guest/PrivacySettings';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDailyCheckManagement from './pages/admin/AdminDailyCheckManagement';
import AdminRooms from './pages/admin/AdminRooms';
import RoomDetailsPage from './pages/admin/RoomDetailsPage';
import RoomBookingsPage from './pages/admin/RoomBookingsPage';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUpcomingBookings from './pages/admin/AdminUpcomingBookings';
import AdminStaffManagement from './pages/admin/AdminStaffManagement';
import AdminHousekeeping from './pages/admin/AdminHousekeeping';
import AdminInventory from './pages/admin/AdminInventory';
import AdminLaundryManagement from './pages/admin/AdminLaundryManagement';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminGuestServices from './pages/admin/AdminGuestServices';
import AdminSupplyRequests from './pages/admin/AdminSupplyRequests';
import AdminReports from './pages/admin/AdminReports';
import AdminOTA from './pages/admin/AdminOTA';
import BillingHistory from './pages/admin/BillingHistory';
import AdminBypassCheckoutPage from './pages/admin/AdminBypassCheckout';
import AdminBypassApprovalsPage from './pages/admin/AdminBypassApprovals';
import AdminSecurityDashboardPage from './pages/admin/AdminSecurityDashboard';
import AdminFinancialAnalyticsPage from './pages/admin/AdminFinancialAnalytics';
import AdminCorporateDashboard from './pages/admin/AdminCorporateDashboard';
import AdminTapeChart from './pages/admin/AdminTapeChart';
import AdminPOS from './pages/admin/AdminPOS';
import AdminRevenueManagement from './pages/admin/AdminRevenueManagement';
import AdminBookingEngine from './pages/admin/AdminBookingEngine';
import AdminFinancial from './pages/admin/AdminFinancial';
import AdminMultiProperty from './pages/admin/AdminMultiProperty';
import AdminMobileApps from './pages/admin/AdminMobileApps';
import AdminAPIManagement from './pages/admin/AdminAPIManagement';
import AdminPOSTaxes from './pages/admin/AdminPOSTaxes';
import AdminMeasurementUnits from './pages/admin/AdminMeasurementUnits';
import AdminPOSAttributes from './pages/admin/AdminPOSAttributes';
import AdminBillMessages from './pages/admin/AdminBillMessages';
import AdminRoomTypes from './pages/admin/AdminRoomTypes';
import AdminRoomTypeAllotments from './pages/admin/AdminRoomTypeAllotments';
import AdminRoomAllotmentCreate from './pages/admin/AdminRoomAllotmentCreate';
import AdminInventoryManagement from './pages/admin/AdminInventoryManagement';
import CorporateCreditManagement from './components/admin/CorporateCreditManagement';
import GSTManagement from './components/admin/GSTManagement';
import CorporateUserRegistration from './components/admin/CorporateUserRegistration';
import { InventoryTemplateManagement } from './components/admin/InventoryTemplateManagement';
import AIDashboard from './components/analytics/AIDashboard';
import { NotificationAnalyticsDashboard } from './components/analytics/NotificationAnalyticsDashboard';
import OverbookingConfiguration from './components/admin/OverbookingConfiguration';
import AdminWebSettings from './pages/admin/AdminWebSettings';
import AdminBookingFormBuilder from './pages/admin/AdminBookingFormBuilder';
import AdminAutomation from './pages/admin/AdminAutomation';
import AdminOfferManagement from './pages/admin/AdminOfferManagement';
import AdminServiceManagement from './pages/admin/AdminServiceManagement';
import AdminDigitalKeyManagement from './pages/admin/AdminDigitalKeyManagement';
import AdminMeetUpManagement from './pages/admin/AdminMeetUpManagement';
import AdminInventoryRequests from './pages/admin/AdminInventoryRequests';
import AdminServiceRequests from './pages/admin/AdminServiceRequests';
import AdminCheckoutInventoryManagement from './pages/admin/AdminCheckoutInventoryManagement';
import AdminTravelDashboard from './pages/admin/AdminTravelDashboard';
import AdminDocumentVerification from './pages/admin/AdminDocumentVerification';
import AdminDocumentAnalytics from './pages/admin/AdminDocumentAnalytics';
import AdminNotifications from './pages/admin/AdminNotifications';
import TravelAgentDashboard from './pages/travel-agent/TravelAgentDashboard';
import TravelAgentNotifications from './pages/travel-agent/TravelAgentNotifications';
import BookingCreate from './pages/travel-agent/BookingCreate';
import ViewRates from './pages/travel-agent/ViewRates';
import ProfileEdit from './pages/travel-agent/ProfileEdit';
import MultiBooking from './pages/travel-agent/MultiBooking';
import TravelAgentSettings from './pages/travel-agent/TravelAgentSettings';

// Admin Settings Pages
import AdminProfileSettings from './pages/admin/settings/ProfileSettings';
import AdminNotificationSettings from './pages/admin/settings/NotificationSettings';
import AdminDisplaySettings from './pages/admin/settings/DisplaySettings';
import AdminHotelSettings from './pages/admin/settings/HotelSettings';
import AdminSystemSettings from './pages/admin/settings/SystemSettings';
import AdminIntegrationSettings from './pages/admin/settings/IntegrationSettings';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffUpcomingBookings from './pages/staff/StaffUpcomingBookings';
import StaffNotifications from './pages/staff/StaffNotifications';
import StaffHousekeeping from './pages/staff/StaffHousekeeping';
import StaffMaintenance from './pages/staff/StaffMaintenance';
import StaffGuestServices from './pages/staff/StaffGuestServices';
import StaffInventoryRequests from './pages/staff/StaffInventoryRequests';
import StaffServiceRequests from './pages/staff/StaffServiceRequests';
import StaffSupplyRequests from './pages/staff/StaffSupplyRequests';
import StaffRooms from './pages/staff/StaffRooms';
import StaffInventory from './pages/staff/StaffInventory';
import StaffReports from './pages/staff/StaffReports';
import StaffAlertCenter from './pages/staff/StaffAlertCenter';
import StaffMeetUpSupervision from './pages/staff/StaffMeetUpSupervision';
import CheckoutInventory from './pages/staff/CheckoutInventory';
import DailyRoutineCheck from './pages/staff/DailyRoutineCheck';
import StaffDocuments from './pages/staff/StaffDocuments';
import { DailyInventoryCheckForm } from './components/staff/DailyInventoryCheckForm';

// Staff Settings Pages
import StaffProfileSettings from './pages/staff/settings/StaffProfileSettings';
import StaffNotificationSettings from './pages/staff/settings/StaffNotificationSettings';
import StaffDisplaySettings from './pages/staff/settings/StaffDisplaySettings';
import StaffAvailabilitySettings from './pages/staff/settings/StaffAvailabilitySettings';

// Layout Components
import PublicLayout from './layouts/PublicLayout';
import GuestLayout from './layouts/GuestLayout';
import TravelAgentLayout from './layouts/TravelAgentLayout';
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
              {/* Public Routes - Accessible to all users */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="rooms/:type" element={<RoomDetailPage />} />
                <Route path="booking" element={<BookingPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Guest App Routes */}
              <Route path="/app" element={
                <ProtectedRoute allowedRoles={['guest']}>
                  <GuestLayout />
                </ProtectedRoute>
              }>
                <Route index element={<GuestDashboard />} />
                <Route path="bookings" element={<GuestBookings />} />
                            <Route path="bookings/:id" element={<GuestBookingDetail />} />
            <Route path="billing" element={<GuestBillingHistory />} />
            <Route path="loyalty" element={<LoyaltyDashboard />} />
            <Route path="loyalty/offers" element={<AllOffers />} />
            <Route path="loyalty/favorites" element={<FavoritesPage />} />
            <Route path="loyalty/recommendations" element={<RecommendationsPage />} />
            <Route path="loyalty/transactions" element={<LoyaltyTransactions />} />
            <Route path="services" element={<HotelServicesDashboard />} />
            <Route path="services/:serviceId" element={<ServiceDetailsPage />} />
            <Route path="services/:serviceId/book" element={<ServiceBookingPage />} />
            <Route path="services/bookings" element={<MyServiceBookings />} />
            <Route path="services/bookings/confirmation/:bookingId" element={<ServiceBookingConfirmation />} />
            <Route path="notifications" element={<NotificationsDashboard />} />
            <Route path="keys" element={<DigitalKeysDashboard />} />
            <Route path="meet-ups" element={<MeetUpRequestsDashboard />} />
            <Route path="profile" element={<GuestProfile />} />
                        <Route path="requests" element={<GuestRequests />} />
            <Route path="inventory-requests" element={<InventoryRequests />} />
            <Route path="documents" element={<GuestDocuments />} />
            <Route path="feedback" element={<GuestFeedback />} />
            <Route path="settings/profile" element={<ProfileSettings />} />
            <Route path="settings/preferences" element={<PreferencesSettings />} />
            <Route path="settings/privacy" element={<PrivacySettings />} />
            <Route path="mobile-app" element={<ContactlessGuestApp />} />
          </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="rooms" element={<AdminRooms />} />
                <Route path="rooms/:roomId" element={<RoomDetailsPage />} />
                <Route path="rooms/:roomId/bookings" element={<RoomBookingsPage />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="upcoming-bookings" element={<AdminUpcomingBookings />} />
                <Route path="staff" element={<AdminStaffManagement />} />
                <Route path="corporate" element={<AdminCorporateDashboard />} />
                <Route path="corporate/credit" element={<CorporateCreditManagement />} />
                <Route path="corporate/gst" element={<GSTManagement />} />
                <Route path="corporate/users" element={<CorporateUserRegistration />} />
                <Route path="housekeeping" element={<AdminHousekeeping />} />
                <Route path="daily-check-management" element={<AdminDailyCheckManagement />} />
                <Route path="maintenance" element={<AdminMaintenance />} />
                <Route path="guest-services" element={<AdminGuestServices />} />
                <Route path="inventory-requests" element={<AdminInventoryRequests />} />
                <Route path="service-requests" element={<AdminServiceRequests />} />
                <Route path="supply-requests" element={<AdminSupplyRequests />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="checkout-inventory" element={<AdminCheckoutInventoryManagement />} />
                <Route path="inventory/templates" element={<InventoryTemplateManagement />} />
                <Route path="inventory-management" element={<AdminInventoryManagement />} />
                <Route path="laundry" element={<AdminLaundryManagement />} />
                <Route path="room-types" element={<AdminRoomTypes />} />
                <Route path="room-allotments/create" element={<AdminRoomAllotmentCreate />} />
                <Route path="room-allotments" element={<AdminRoomTypeAllotments />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="bypass-checkout" element={<AdminBypassCheckoutPage />} />
                <Route path="bypass-approvals" element={<AdminBypassApprovalsPage />} />
                <Route path="security-dashboard" element={<AdminSecurityDashboardPage />} />
                <Route path="financial-analytics" element={<AdminFinancialAnalyticsPage />} />
                <Route path="ota" element={<AdminOTA />} />
                <Route path="billing" element={<BillingHistory />} />
                <Route path="tape-chart" element={<AdminTapeChart />} />
                <Route path="pos/taxes" element={<AdminPOSTaxes />} />
                <Route path="pos/measurement-units" element={<AdminMeasurementUnits />} />
                <Route path="pos/attributes" element={<AdminPOSAttributes />} />
                <Route path="pos/bill-messages" element={<AdminBillMessages />} />
                <Route path="pos" element={<AdminPOS />} />
                <Route path="revenue" element={<AdminRevenueManagement />} />
                <Route path="overbooking" element={<OverbookingConfiguration />} />
                <Route path="booking-engine" element={<AdminBookingEngine />} />
                <Route path="booking-forms" element={<AdminBookingFormBuilder />} />
                <Route path="web-settings" element={<AdminWebSettings />} />
                <Route path="financial" element={<AdminFinancial />} />
                <Route path="multi-property" element={<AdminMultiProperty />} />
                <Route path="mobile-apps" element={<AdminMobileApps />} />
                <Route path="api-management" element={<AdminAPIManagement />} />
                <Route path="ai-dashboard" element={<AIDashboard />} />
                <Route path="automation" element={<AdminAutomation />} />
                <Route path="offers" element={<AdminOfferManagement />} />
                <Route path="services" element={<AdminServiceManagement />} />
                <Route path="digital-keys" element={<AdminDigitalKeyManagement />} />
                <Route path="meet-up-management" element={<AdminMeetUpManagement />} />
                <Route path="documents" element={<AdminDocumentVerification />} />
                <Route path="documents/analytics" element={<AdminDocumentAnalytics />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="notification-analytics" element={<NotificationAnalyticsDashboard />} />
                <Route path="travel-dashboard" element={<AdminTravelDashboard />} />

                {/* Admin Settings Routes */}
                <Route path="settings/profile" element={<AdminProfileSettings />} />
                <Route path="settings/notifications" element={<AdminNotificationSettings />} />
                <Route path="settings/display" element={<AdminDisplaySettings />} />
                <Route path="settings/hotel" element={<AdminHotelSettings />} />
                <Route path="settings/system" element={<AdminSystemSettings />} />
                <Route path="settings/integrations" element={<AdminIntegrationSettings />} />
              </Route>

              {/* Travel Agent Routes */}
              <Route path="/travel-agent" element={
                <ProtectedRoute allowedRoles={['travel_agent']}>
                  <TravelAgentLayout />
                </ProtectedRoute>
              }>
                <Route index element={<TravelAgentDashboard />} />
                <Route path="dashboard" element={<TravelAgentDashboard />} />
                <Route path="notifications" element={<TravelAgentNotifications />} />
                <Route path="bookings" element={<TravelAgentDashboard />} />
                <Route path="booking/new" element={<BookingCreate />} />
                <Route path="new-booking" element={<BookingCreate />} />
                <Route path="multi-booking" element={<MultiBooking />} />
                <Route path="rates" element={<ViewRates />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="settings" element={<TravelAgentSettings />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffLayout />
                </ProtectedRoute>
              }>
                <Route index element={<StaffDashboard />} />
                <Route path="upcoming-bookings" element={<StaffUpcomingBookings />} />
                <Route path="notifications" element={<StaffNotifications />} />
                <Route path="alerts" element={<StaffAlertCenter />} />
                <Route path="meetup-supervision" element={<StaffMeetUpSupervision />} />
                <Route path="inventory-check/:roomId" element={<DailyInventoryCheckForm />} />
                <Route path="inventory-check" element={<DailyInventoryCheckForm />} />
                <Route path="housekeeping" element={<StaffHousekeeping />} />
                <Route path="maintenance" element={<StaffMaintenance />} />
                <Route path="guest-services" element={<StaffGuestServices />} />
                <Route path="inventory-requests" element={<StaffInventoryRequests />} />
                <Route path="service-requests" element={<StaffServiceRequests />} />
                <Route path="supply-requests" element={<StaffSupplyRequests />} />
                <Route path="rooms" element={<StaffRooms />} />
                                                  <Route path="inventory" element={<StaffInventory />} />
                <Route path="daily-routine-check" element={<DailyRoutineCheck />} />
                <Route path="checkout-inventory" element={<CheckoutInventory />} />
                <Route path="documents" element={<StaffDocuments />} />
                <Route path="reports" element={<StaffReports />} />

                {/* Staff Settings Routes */}
                <Route path="settings/profile" element={<StaffProfileSettings />} />
                <Route path="settings/notifications" element={<StaffNotificationSettings />} />
                <Route path="settings/display" element={<StaffDisplaySettings />} />
                <Route path="settings/availability" element={<StaffAvailabilitySettings />} />
              </Route>

                            {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
              },
            }}
          />
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
);
}

export default App;