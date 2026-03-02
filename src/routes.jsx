import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
  Briefcase,
  Users,
  ClipboardCheck,
  UserCheck,
  BarChart2,
  Shield,
  Award,
  Activity,
  Bell,
} from "lucide-react";

// Page Imports
import Dashboard from "./pages/overview/Dashboard";
import Locations from "./pages/management/Locations";
import Buildings from "./pages/management/Buildings";
import Malls from "./pages/management/Malls";
import Sites from "./pages/management/Sites";
import Supervisors from "./pages/supervisors/Supervisors";
import Workers from "./pages/workers-management/Workers";
import Staff from "./pages/workers-management/Staff";
import Attendance from "./pages/workers-management/Attendance";

import Settings from "./pages/support/Settings";
import SalarySettings from "./pages/support/SalarySettings";
import ImportLogs from "./pages/support/ImportLogs";
import Bookings from "./pages/support/Bookings";
import Enquiry from "./pages/support/Enquiry";
import Pricing from "./pages/finance/Pricing";
import Customers from "./pages/customers/Customers";
import CustomerHistory from "./pages/customers/CustomerHistory";
import CustomerActivityDetail from "./pages/customers/CustomerActivityDetail";
import WorkerActivityDetail from "./pages/workers-management/WorkerActivityDetail";
import VehicleManagement from "./pages/customers/VehicleManagement";
import ImportHistory from "./pages/customers/ImportHistory";
import OneWash from "./pages/washes/OneWash";
import Residence from "./pages/washes/Residence";

import OneWashPayments from "./pages/finance/OneWashPayments";
import ResidencePayments from "./pages/finance/ResidencePayments";
import WorkRecords from "./pages/finance/WorkRecords";
import CollectionSheet from "./pages/finance/CollectionSheet";
import Settlements from "./pages/finance/Settlements";
import WorkerCustomers from "./pages/workers-management/WorkerCustomers";
import WorkerPayments from "./pages/workers-management/WorkerPayments";
import WorkerWashedCars from "./pages/workers-management/WorkerWashedCars";
import WorkerHistory from "./pages/workers-management/WorkerHistory";
import StaffProfile from "./pages/workers-management/StaffProfile";
import WorkerProfile from "./pages/workers-management/WorkerProfile";
import MonthlyRecords from "./pages/workers-management/MonthlyRecords";
import YearlyRecords from "./pages/workers-management/YearlyRecords";
import SalarySlip from "./pages/salary/SalarySlip";
import PendingPayments from "./pages/pending-payments/PendingPayments";

// Supervisor Pages
import SupervisorDashboard from "./pages/supervisor/Dashboard";
import SupervisorOnewash from "./pages/supervisor/Onewash";
import SupervisorResidence from "./pages/supervisor/Residence";
import SupervisorWorkers from "./pages/supervisor/Workers";
import SupervisorSettlements from "./pages/supervisor/Settlements";
import SupervisorOneWashPayments from "./pages/supervisor/OneWashPayments";
import SupervisorYearlyRecords from "./pages/supervisor/YearlyRecords";

// Notifications
import Notifications from "./pages/notifications/Notifications";

// Activity Tracking
import AdminTracking from "./pages/tracking/AdminTracking";

export const routes = [
  // --- OVERVIEW ---
  {
    path: "/",
    title: "Dashboard Overview",
    component: <Dashboard />,
    icon: LayoutDashboard,
  },

  // --- MANAGEMENT ---
  {
    path: "/locations",
    component: <Locations />,
  },
  {
    path: "/buildings",
    component: <Buildings />,
  },
  {
    path: "/malls",
    component: <Malls />,
  },
  {
    path: "/sites",
    component: <Sites />,
  },

  // --- WORKERS SECTION ---
  {
    path: "/workers/list",
    title: "Workers",
    component: <Workers />,
    icon: UserCheck,
  },
  {
    path: "/workers/monthly",
    title: "Monthly Records",
    component: <MonthlyRecords />,
    icon: UserCheck,
  },
  {
    path: "/workers/yearly",
    title: "Yearly Records",
    component: <YearlyRecords />,
    icon: BarChart2, // Make sure to import this
  },
  {
    path: "/pending-payments",
    title: "Pending Payments",
    component: <PendingPayments />,
    icon: BarChart2, // Make sure to import this
  },
  {
    path: "/salary/slip/:workerId/:year/:month", // New Route
    title: "Generate Slip",
    component: <SalarySlip />,
  },
  {
    path: "/workers/:id",
    title: "Worker Profile",
    component: <WorkerProfile />,
  },
  // Hidden Worker Detail Routes
  {
    path: "/workers/:id/customers",
    title: "Worker Customers",
    component: <WorkerCustomers />,
  },
  {
    path: "/workers/:id/payments",
    title: "Worker Payments",
    component: <WorkerPayments />,
  },
  {
    path: "/workers/:id/washed-cars",
    title: "Worker Washed Cars",
    component: <WorkerWashedCars />,
  },
  {
    path: "/workers/:id/history",
    title: "Worker History",
    component: <WorkerHistory />,
  },
  {
    path: "/workers/:id/history",
    title: "Worker History",
    component: <WorkerHistory />,
  },
  {
    path: "/workers/:workerId/activity",
    title: "Worker Activity",
    component: <WorkerActivityDetail />,
  },
  {
    path: "/workers/staff",
    title: "Staff",
    component: <Staff />,
    icon: Users,
  },
  {
    path: "/workers/staff/:id",
    title: "Staff",
    component: <StaffProfile />,
    icon: Users,
  },

  {
    path: "/workers/attendance",
    title: "Attendance",
    component: <Attendance />,
    icon: ClipboardCheck,
  },

  {
    path: "/supervisors",
    component: <Supervisors />,
  },

  // --- CUSTOMERS SECTION ---
  {
    path: "/customers",
    title: "Customer Database",
    component: <Customers />,
    icon: Users,
  },
  // Hidden Detail Route (No icon needed as it's not in sidebar)
  {
    path: "/customers/:id/history",
    title: "Customer History",
    component: <CustomerHistory />,
  },
  {
    path: "/customers/:customerId/activity",
    title: "Customer Activity",
    component: <CustomerActivityDetail />,
  },
  {
    path: "/customers/vehicle-management",
    title: "Vehicle Management",
    component: <VehicleManagement />,
  },
  {
    path: "/customers/import-history",
    title: "Import History",
    component: <ImportHistory />,
  },

  // --- WASHES ---
  {
    path: "/washes/onewash",
    title: "One Wash Service",
    component: <OneWash />,
    icon: Droplets,
  },
  {
    path: "/washes/residence",
    title: "Residence Service",
    component: <Residence />,
    icon: Droplets,
  },
  // --- FINANCE ---
  {
    path: "/payments",
    title: "Payment Transactions",
    component: <OneWashPayments />, // Transaction History (default)
    icon: DollarSign,
  },

  {
    path: "/payments/onewash",
    title: "One Wash Payments",
    component: <OneWashPayments />, // or different component if you prefer
    icon: DollarSign,
  },

  {
    path: "/payments/residence",
    title: "Residence Payments",
    component: <ResidencePayments />, // <-- use your Residence payments page
    icon: DollarSign,
  },

  {
    path: "/work-records",
    title: "Work Records",
    component: <WorkRecords />,
    icon: FileText,
  },
  {
    path: "/collection-sheet",
    title: "Collection Sheet",
    component: <CollectionSheet />,
    icon: Receipt,
  },
  {
    path: "/settlements",
    title: "Settlements",
    component: <Settlements />,
    icon: Wallet,
  },
  {
    path: "/pricing",
    title: "Pricing Configuration",
    component: <Pricing />,
    icon: Tags,
  },

  // --- SUPPORT ---
  {
    path: "/enquiry",
    title: "Enquiries",
    component: <Enquiry />,
    icon: HelpCircle,
  },
  {
    path: "/bookings",
    title: "Bookings",
    component: <Bookings />,
  },
  {
    path: "/import-logs",
    title: "Import Logs",
    component: <ImportLogs />,
    icon: FileText,
  },
  {
    path: "/settings",
    title: "Settings",
    component: <Settings />,
  },
  {
    path: "/settings/salary",
    title: "Salary Configuration",
    component: <SalarySettings />,
  },

  // --- NOTIFICATIONS ---
  {
    path: "/notifications",
    title: "All Notifications",
    component: <Notifications />,
    icon: Bell,
  },

  // --- ACTIVITY TRACKING (hidden route, no icon = no sidebar entry) ---
  {
    path: "/tracking",
    title: "Activity Tracking",
    component: <AdminTracking />,
  },

  // --- SUPERVISOR SECTION ---
  {
    path: "/supervisor/dashboard",
    title: "Supervisor Dashboard",
    component: <SupervisorDashboard />,
    icon: Shield,
  },
  {
    path: "/supervisor/washes/onewash",
    title: "Supervisor One Wash",
    component: <SupervisorOnewash />,
    icon: Droplets,
  },
  {
    path: "/supervisor/washes/residence",
    title: "Supervisor Residence",
    component: <SupervisorResidence />,
    icon: Droplets,
  },
  {
    path: "/supervisor/workers",
    title: "Supervisor Workers",
    component: <SupervisorWorkers />,
    icon: Users,
  },
  {
    path: "/supervisor/payments/onewash",
    title: "Supervisor One Wash Payments",
    component: <SupervisorOneWashPayments />,
    icon: DollarSign,
  },
  {
    path: "/supervisor/yearly-records",
    title: "Supervisor Yearly Records",
    component: <SupervisorYearlyRecords />,
    icon: BarChart2,
  },
  {
    path: "/supervisor/settlements",
    title: "Supervisor Settlements",
    component: <SupervisorSettlements />,
    icon: Wallet,
  },
];
