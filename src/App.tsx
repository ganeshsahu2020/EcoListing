// ui/src/App.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";

import Header from "./components/Header";
// import BottomNav from "./components/BottomNav"; // ⛔️ replaced by MobileDock
import Footer from "./components/Footer";
import RequireRole from "./components/RequireRole";
import ScrollToTop from "./components/ScrollToTop";
import MobileDock from "./components/MobileDock"; // ✅ new

// Core pages
import Home from "./pages/Home";
import MapSearchSummary from "./pages/MapSearchSummary";
import PropertyDetail from "./pages/property/PropertyDetail";
import ListingByMls from "./pages/ListingByMls";
import Saved from "./pages/Saved";
import DeveloperHub from "./pages/DeveloperHub";

// Repliers-only Listings page
import Listings from "./pages/listings/Listings";

// Advanced search
import AdvancedSearch from "./pages/AdvancedSearch";

// Flows
import Tour from "./pages/Tour";
import Offer from "./pages/Offer";
import Close from "./pages/Close";
import ThankYou from "./pages/ThankYou";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin / Agent tools
import Agents from "./pages/Agents";

// Agent pages
import AgentLeadInbox from "./pages/agent/LeadInbox";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentAppointments from "./pages/agent/Appointments";
import AgentMessages from "./pages/agent/Messages";
import AgentReport from "./pages/agent/AgentReport";
import AgentReportQueue from "./pages/agent/AgentReportQueue";
import AgentReportRequest from "./pages/agent/AgentReportRequest";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminActivity from "./pages/AdminActivity";
import AdminUsers from "./pages/AdminUsers";
import AdminContactMessages from "./pages/AdminContactMessages";

// Admin layout
import AdminLayout from "./layouts/AdminLayout";

// Misc
import Chat from "./pages/Chat";
import { usePageviews } from "./utils/activity";

// Static
import FAQ from "./pages/static/FAQ";
import About from "./pages/static/About";
import Contact from "./pages/static/Contact";
import Privacy from "./pages/static/Privacy";
import Careers from "./pages/static/Careers";
import Press from "./pages/static/Press";
import TermsOfService from "./pages/static/TermsOfService";

// Marketing page (single canonical route)
import HowWeSell from "./pages/HowWeSell";

// Recent pages (LAZY the heavy ones)
const WhatsMyHomeWorth = React.lazy(() => import("./pages/WhatsMyHomeWorth"));
const MarketTrend = React.lazy(() => import("./pages/MarketTrend"));
const FindComparable = React.lazy(() => import("./pages/FindComparable"));
const SellerInsights = React.lazy(() => import("./pages/SellerInsights")); // ← NEW

/* User Dashboard (protected, nested) */
import Dashboard from "./pages/usermanagement/Dashboard";
import SavedHome from "./pages/usermanagement/SavedHome";
import SavedSearches from "./pages/usermanagement/SavedSearches";
import UserAppointments from "./pages/usermanagement/Appointments";
import MessagesChat from "./pages/usermanagement/MessagesChat";
import ProfileSetting from "./pages/usermanagement/ProfileSetting";
import AgentReports from "./pages/usermanagement/AgentReports";

/* Agent-Only guard (role-based) */
import { useMyRole } from "./utils/useMyRole";

/* AllSearch (filters page wrapper) */
import AllSearch, { FilterState } from "./components/AllSearch";

/* Helper: Build a compact query string from filters */
function buildQueryFromFilters(s: FilterState): string {
  const p = new URLSearchParams();
  if (s.status && s.status !== "all") p.set("status", s.status);
  if (s.status === "for-sale" && s.daysOnMarket && s.daysOnMarket !== "all") p.set("dom", s.daysOnMarket);
  if (s.status === "sold" && s.soldWithin) p.set("sold_within", s.soldWithin);
  if (s.priceMin != null) p.set("min_price", String(s.priceMin));
  if (s.priceMax != null) p.set("max_price", String(s.priceMax));
  if (s.beds !== "any") p.set("beds", String(s.beds));
  if (s.excludeDenBasement) p.set("exclude_den_basement", "1");
  if (s.bathsMin && s.bathsMin > 0) p.set("baths_min", String(s.bathsMin));
  const types = Object.entries(s.propertyTypes).filter(([, v]) => v).map(([k]) => k);
  if (types.length) p.set("types", types.join(","));
  const styles: string[] = [];
  (Object.keys(s.propertyStyles) as (keyof FilterState["propertyStyles"])[]).forEach((group) => {
    s.propertyStyles[group].forEach((st) => styles.push(`${group}:${st}`));
  });
  if (styles.length) p.set("styles", styles.join("|"));
  if (s.openHouse && s.openHouse !== "any") p.set("open_house", s.openHouse);
  if (s.listingInfo.floorPlan) p.set("has_floorplan", "1");
  if (s.listingInfo.virtualTour) p.set("has_vtour", "1");
  if (s.listingInfo.priceDecreased) p.set("price_decreased", "1");
  if (s.taxesMax != null) p.set("tax_max", String(s.taxesMax));
  if (s.maintenanceMax != null) p.set("maint_max", String(s.maintenanceMax));
  if (s.excludeMaintenance) p.set("exclude_maint", "1");
  if (s.sizeMin != null) p.set("size_min", String(s.sizeMin));
  if (s.sizeMax != null) p.set("size_max", String(s.sizeMax));
  if (s.ageMin != null) p.set("age_min", String(s.ageMin));
  if (s.ageMax != null) p.set("age_max", String(s.ageMax));
  if (s.renovated.kitchen) p.set("reno_kitchen", "1");
  if (s.renovated.bathroom) p.set("reno_bath", "1");
  if (s.basement.mustHave !== null) p.set("basement", s.basement.mustHave ? "yes" : "no");
  if (s.basement.type) p.set("basement_type", s.basement.type);
  if (s.basement.separateEntrance !== null) p.set("sep_entrance", s.basement.separateEntrance ? "yes" : "no");
  if (s.amenities.length) p.set("amenities", s.amenities.join(","));
  if (s.keywords.length) p.set("keywords", s.keywords.join(","));
  const near: string[] = [];
  if (s.locatedNear.waterfront) near.push("waterfront");
  if (s.locatedNear.forest) near.push("forest");
  if (s.locatedNear.mountain) near.push("mountain");
  if (near.length) p.set("near", near.join(","));
  if (s.lot.widthMin != null) p.set("lotw_min", String(s.lot.widthMin));
  if (s.lot.depthMin != null) p.set("lotd_min", String(s.lot.depthMin));
  if (s.parking.totalMin !== "any") p.set("parking_min", String(s.parking.totalMin));
  if (s.parking.mustHaveGarage !== null) p.set("garage", s.parking.mustHaveGarage ? "yes" : "no");
  if (s.parking.garageSpacesMin !== "any") p.set("garage_min", String(s.parking.garageSpacesMin));
  const prox: string[] = [];
  if (s.proximity.transit) prox.push("transit");
  if (s.proximity.bike) prox.push("bike");
  if (s.proximity.pedestrian) prox.push("walk");
  if (s.proximity.car) prox.push("car");
  if (prox.length) p.set("prox", prox.join(","));
  const access: string[] = [];
  Object.entries(s.accessTo).forEach(([k, v]) => v && access.push(k));
  if (access.length) p.set("access", access.join(","));
  const mood: string[] = [];
  if (s.atmosphere.quiet) mood.push("quiet");
  if (s.atmosphere.vibrant) mood.push("vibrant");
  if (mood.length) p.set("atmo", mood.join(","));
  return p.toString();
}

/* Page wrapper to show AllSearch + results */
function AllFiltersStandalone() {
  const navigate = useNavigate();
  const handleApply = (st: FilterState) => {
    const qs = buildQueryFromFilters(st);
    navigate(`/search?${qs}`);
  };
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <AllSearch
        onApply={handleApply}
        onReset={() => navigate("/search")}
        sticky
        showHeader
        className="lg:self-start"
      />
      <div className="min-h-[60vh] rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-2xl">
        <MapSearchSummary />
      </div>
    </div>
  );
}

function AgentOnly({ children }: { children: React.ReactElement }) {
  const { role, loading } = useMyRole();
  if (loading) return null;
  if (role !== "agent" && role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/** Legacy wrapper to preserve :id when redirecting to /property/:rid */
function LegacyListingRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/property/${encodeURIComponent(id)}` : "/"} replace />;
}

export default function App() {
  usePageviews();

  return (
    // NOTE: pb-20 reserves space for the MobileDock on small screens
    <div className="flex min-h-screen flex-col bg-white pb-20 text-slate-900 md:pb-0">
      <Header />
      <ScrollToTop />

      <main className="flex-1 pt-16">
        {/* Outer Suspense ensures ANY lazy page won’t block boot */}
        <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
          <Routes>
            {/* Public site */}
            <Route path="/" element={<Home />} />
            <Route path="/featured" element={<Navigate to="/" replace />} />

            {/* Search */}
            <Route path="/search" element={<MapSearchSummary />} />
            <Route path="/search/advanced" element={<AdvancedSearch />} />
            <Route path="/search/filters" element={<AllFiltersStandalone />} />

            {/* Saved */}
            <Route path="/saved" element={<Saved />} />

            {/* Listings */}
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={<Navigate to="/listings" replace />} />

            {/* Property */}
            <Route path="/property/:rid" element={<PropertyDetail />} />
            <Route path="/listing/:id" element={<LegacyListingRedirect />} />
            <Route path="/listing" element={<ListingByMls />} />

            {/* Flows */}
            <Route path="/tour" element={<Tour />} />
            <Route path="/offer" element={<Offer />} />
            <Route
              path="/close"
              element={
                <RequireRole allow={["user", "agent", "superadmin"]}>
                  <Close />
                </RequireRole>
              }
            />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Dev / utilities */}
            <Route path="/dev" element={<DeveloperHub />} />

            {/* Static */}
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* How We Sell — single canonical route */}
            <Route path="/how-we-sell" element={<HowWeSell />} />

            {/* Recent/marketing pages (LAZY) */}
            <Route
              path="/whats-my-home-worth"
              element={
                <Suspense fallback={<div style={{ padding: 16 }}>Loading home value…</div>}>
                  <WhatsMyHomeWorth />
                </Suspense>
              }
            />
            <Route
              path="/market-trend"
              element={
                <Suspense fallback={<div style={{ padding: 16 }}>Loading market trends…</div>}>
                  <MarketTrend />
                </Suspense>
              }
            />
            <Route path="/market-trends" element={<Navigate to="/market-trend" replace />} />
            <Route path="/trends" element={<Navigate to="/market-trend" replace />} />

            {/* Seller Insights (LAZY) */}
            <Route
              path="/seller-insights"
              element={
                <Suspense fallback={<div style={{ padding: 16 }}>Loading Seller Insights…</div>}>
                  <SellerInsights />
                </Suspense>
              }
            />

            {/* Auth */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/forgot" element={<ForgotPassword />} />
            <Route path="/auth/reset" element={<ResetPassword />} />

            {/* Public: guest Agent Report request */}
            <Route path="/agent/report-request" element={<AgentReportRequest />} />

            {/* Find Comparable (LAZY) */}
            <Route
              path="/find-comparable"
              element={
                <Suspense fallback={<div style={{ padding: 16 }}>Loading comparables…</div>}>
                  <FindComparable />
                </Suspense>
              }
            />
            <Route path="/find-comparables" element={<Navigate to="/find-comparable" replace />} />

            {/* User dashboard (protected & nested) */}
            <Route
              path="/dashboard"
              element={
                <RequireRole allow={["user", "agent", "superadmin"]}>
                  <Dashboard />
                </RequireRole>
              }
            >
              <Route index element={<Navigate to="saved-homes" replace />} />
              <Route path="saved-homes" element={<SavedHome />} />
              <Route path="saved-searches" element={<SavedSearches />} />
              <Route path="appointments" element={<UserAppointments />} />
              <Route path="messages" element={<MessagesChat />} />
              <Route path="profile" element={<ProfileSetting />} />
              <Route path="agent-reports" element={<AgentReports />} />
            </Route>

            {/* Admin (superadmin-only) */}
            <Route
              path="/admin/dashboard"
              element={
                <RequireRole allow={["superadmin"]}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole allow={["superadmin"]}>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/contact-messages"
              element={
                <RequireRole allow={["superadmin"]}>
                  <AdminLayout>
                    <AdminContactMessages />
                  </AdminLayout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <RequireRole allow={["superadmin"]}>
                  <AdminLayout>
                    <AdminActivity />
                  </AdminLayout>
                </RequireRole>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Agent public directory */}
            <Route path="/agents" element={<Agents />} />

            {/* Agent-only (and superadmins) */}
            <Route
              path="/agent"
              element={
                <AgentOnly>
                  <AgentDashboard />
                </AgentOnly>
              }
            />
            <Route path="/agent/dashboard" element={<Navigate to="/agent" replace />} />
            <Route
              path="/agent/leads"
              element={
                <AgentOnly>
                  <AgentLeadInbox />
                </AgentOnly>
              }
            />
            <Route
              path="/agent/appointments"
              element={
                <AgentOnly>
                  <AgentAppointments />
                </AgentOnly>
              }
            />
            <Route
              path="/agent/messages"
              element={
                <AgentOnly>
                  <AgentMessages />
                </AgentOnly>
              }
            />
            <Route
              path="/agent/reports"
              element={
                <AgentOnly>
                  <AgentReportQueue />
                </AgentOnly>
              }
            />
            <Route
              path="/agent/reports/new"
              element={
                <AgentOnly>
                  <AgentReport />
                </AgentOnly>
              }
            />
            <Route
              path="/agent/reports/:id"
              element={
                <AgentOnly>
                  <AgentReport />
                </AgentOnly>
              }
            />

            {/* Chat (kept available) */}
            <Route path="/chat" element={<Chat />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      {/* ⬇️ MobileDock mounted once, above iOS safe area */}
      <MobileDock savedCount={3} toursCount={1} />
    </div>
  );
}
