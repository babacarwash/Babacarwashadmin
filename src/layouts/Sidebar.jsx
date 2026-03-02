import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Users,
  UserCheck,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
  Briefcase,
  ChevronRight,
  LogOut,
  X,
  ClipboardCheck,
  Settings,
  BarChart2,
  Clock,
  Car,
} from "lucide-react";

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();

  // Get user role from localStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const userRole = user.role || "admin";

  const [openMenus, setOpenMenus] = useState({
    workers: false,
    customers: false,
    washes: false,
    payments: false,
    settings: false,
  });

  // auto expand menu if route is inside it
  useEffect(() => {
    if (location.pathname.startsWith("/workers")) {
      setOpenMenus((p) => ({ ...p, workers: true }));
    }
    if (location.pathname.startsWith("/customers")) {
      setOpenMenus((p) => ({ ...p, customers: true }));
    }
    if (
      location.pathname.startsWith("/washes") ||
      location.pathname.startsWith("/supervisor/washes")
    ) {
      setOpenMenus((p) => ({ ...p, washes: true }));
    }
    if (location.pathname.startsWith("/payments")) {
      setOpenMenus((p) => ({ ...p, payments: true }));
    }
    if (location.pathname.startsWith("/settings")) {
      setOpenMenus((p) => ({ ...p, settings: true }));
    }
  }, [location.pathname]);

  const toggleMenu = (k) => setOpenMenus((p) => ({ ...p, [k]: !p[k] }));

  const isActiveParent = (paths) =>
    paths.some((p) => location.pathname.startsWith(p));

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  // ⭐ DESKTOP MODE
  // collapsed by default → expands on hover
  // ⭐ MOBILE MODE (UNCHANGED)
  const sidebarClasses = !isMobile
    ? `
      group
      fixed top-0 left-0 h-full z-50
      bg-card border-r border-border
      transition-all duration-300
      flex flex-col
      w-[72px] hover:w-[280px]
    `
    : `
      fixed top-0 left-0 h-full z-50
      bg-card border-r border-border
      transition-transform duration-300
      w-[280px] max-w-[85vw] flex flex-col
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `;

  return (
    <>
      {/* Mobile Overlay (unchanged) */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside className={sidebarClasses}>
        {/* HEADER */}
        <div className="h-header-h flex items-center px-5 border-b border-border/50 shrink-0 gap-3 bg-card relative">
          {/* icon logo always visible */}
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-10 h-10 object-contain shrink-0"
          />

          {/* text logo → visible on mobile OR on desktop hover */}
          <img
            src="/logo-text.png"
            alt="Baba Car Wash"
            className={`h-8 max-w-[140px] object-contain ${
              isMobile ? "block" : "hidden group-hover:block"
            }`}
          />

          {/* mobile close button (unchanged) */}
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute right-4 p-2 rounded-full text-text-sub hover:text-danger bg-page hover:bg-red-50 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 py-6 overflow-y-auto no-scrollbar">
          <ul className="space-y-1">
            {/* ==================== SUPERVISOR MENU ==================== */}
            {userRole === "supervisor" ? (
              <>
                {/* Supervisor Overview */}
                <li
                  className={`
                  px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest
                  mb-2 mt-1
                  ${isMobile ? "block" : "hidden group-hover:block"}
                `}
                >
                  Supervisor Panel
                </li>

                <NavItem
                  to="/supervisor/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                <NavItem
                  to="/supervisor/workers"
                  icon={Users}
                  label="My Team"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                <li>
                  <MenuButton
                    label="Washes"
                    icon={Droplets}
                    isOpen={openMenus.washes}
                    isActive={isActiveParent(["/supervisor/washes"])}
                    onClick={() => toggleMenu("washes")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.washes} isMobile={isMobile}>
                    <SubNavItem
                      to="/supervisor/washes/onewash"
                      label="Onewash"
                      onClick={handleLinkClick}
                    />
                    {user.service_type !== "mall" && (
                      <SubNavItem
                        to="/supervisor/washes/residence"
                        label="Residence"
                        onClick={handleLinkClick}
                      />
                    )}
                  </SubMenu>
                </li>

                <li>
                  <MenuButton
                    label="Payments"
                    icon={DollarSign}
                    isOpen={openMenus.payments}
                    isActive={isActiveParent(["/payments"])}
                    onClick={() => toggleMenu("payments")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.payments} isMobile={isMobile}>
                    <SubNavItem
                      to="/supervisor/payments/onewash"
                      label="Onewash"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>

                {/* Work Records & Settlements */}
                <li
                  className={`
                  px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest
                  mb-2 mt-6
                  ${isMobile ? "block" : "hidden group-hover:block"}
                `}
                >
                  Finance
                </li>

                {user.service_type !== "mall" && (
                  <NavItem
                    to="/work-records"
                    icon={FileText}
                    label="Work Records"
                    onClick={handleLinkClick}
                    isMobile={isMobile}
                  />
                )}
                <NavItem
                  to="/supervisor/yearly-records"
                  icon={BarChart2}
                  label="Yearly Work Records"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                <NavItem
                  to="/supervisor/settlements"
                  icon={Wallet}
                  label="Settlements"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
              </>
            ) : (
              <>
                {/* ==================== ADMIN/MANAGER MENU ==================== */}
                {/* section label — only visible when expanded or mobile */}
                <li
                  className={`
                  px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest
                  mb-2 mt-1
                  ${isMobile ? "block" : "hidden group-hover:block"}
                `}
                >
                  Overview
                </li>

                <NavItem
                  to="/"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                {/* CUSTOMERS */}
                <NavItem
                  to="/customers"
                  icon={Users}
                  label="Customers"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                {/* WORKERS */}
                <li>
                  <MenuButton
                    label="Workers Management"
                    icon={Briefcase}
                    isOpen={openMenus.workers}
                    isActive={isActiveParent(["/workers"])}
                    onClick={() => toggleMenu("workers")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.workers} isMobile={isMobile}>
                    <SubNavItem
                      to="/workers/list"
                      label="Workers"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/workers/attendance"
                      label="Attendance"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>

                <NavItem
                  to="/supervisors"
                  icon={UserCheck}
                  label="Supervisors"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                {/* WASHES */}
                <li>
                  <MenuButton
                    label="Washes"
                    icon={Droplets}
                    isOpen={openMenus.washes}
                    isActive={isActiveParent(["/washes"])}
                    onClick={() => toggleMenu("washes")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.washes} isMobile={isMobile}>
                    <SubNavItem
                      to="/washes/onewash"
                      label="One Wash"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/washes/residence"
                      label="Residence"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>

                {/* FINANCE */}
                {/* <li
                  className={`
                  px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest
                  mb-2 mt-6
                  ${isMobile ? "block" : "hidden group-hover:block"}
                `}
                >
                  Finance
                </li> */}

                <li>
                  <MenuButton
                    label="Payments"
                    icon={DollarSign}
                    isOpen={openMenus.payments}
                    isActive={isActiveParent(["/payments"])}
                    onClick={() => toggleMenu("payments")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.payments} isMobile={isMobile}>
                    <SubNavItem
                      to="/payments/onewash"
                      label="One Wash"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/payments/residence"
                      label="Residence"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>

                <NavItem
                  to="/workers/yearly"
                  icon={BarChart2}
                  label="Worker Yearly Records"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                <NavItem
                  to="/pending-payments"
                  icon={Clock}
                  label="Due Lists"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                <NavItem
                  to="/work-records"
                  icon={FileText}
                  label="Work Records"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                <NavItem
                  to="/collection-sheet"
                  icon={Receipt}
                  label="Collection Sheet"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                <NavItem
                  to="/settlements"
                  icon={Wallet}
                  label="Settlements"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                <NavItem
                  to="/pricing"
                  icon={Tags}
                  label="Pricing"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                {/* MANAGEMENT - Hide from supervisors */}
                <li>
                  <MenuButton
                    label="Management"
                    icon={Briefcase}
                    isOpen={openMenus.management}
                    isActive={isActiveParent([
                      "/locations",
                      "/buildings",
                      "/malls",
                      "/sites",
                      "/customers/vehicle-management",
                    ])}
                    onClick={() => toggleMenu("management")}
                    isMobile={isMobile}
                  />
                  <SubMenu isOpen={openMenus.management} isMobile={isMobile}>
                    <SubNavItem
                      to="/locations"
                      label="Locations"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/buildings"
                      label="Buildings"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/malls"
                      label="Malls"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/sites"
                      label="Sites"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/customers/vehicle-management"
                      label="Vehicle Management"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>

                {/* SUPPORT */}
                <li
                  className={`
                  px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest
                  mb-2 mt-6
                  ${isMobile ? "block" : "hidden group-hover:block"}
                `}
                >
                  Support
                </li>

                <NavItem
                  to="/enquiry"
                  icon={HelpCircle}
                  label="Enquiry"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                <NavItem
                  to="/bookings"
                  icon={ClipboardCheck}
                  label="Bookings"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />
                <NavItem
                  to="/import-logs"
                  icon={FileText}
                  label="Import Logs"
                  onClick={handleLinkClick}
                  isMobile={isMobile}
                />

                {/* SETTINGS SUBMENU */}
                <li>
                  <MenuButton
                    label="Settings"
                    icon={Settings}
                    isOpen={openMenus.settings}
                    isActive={isActiveParent(["/settings"])}
                    onClick={() => toggleMenu("settings")}
                    isMobile={isMobile}
                  />

                  <SubMenu isOpen={openMenus.settings} isMobile={isMobile}>
                    <SubNavItem
                      to="/settings"
                      label="General Settings"
                      onClick={handleLinkClick}
                    />
                    <SubNavItem
                      to="/settings/salary"
                      label="Salary Configuration"
                      onClick={handleLinkClick}
                    />
                  </SubMenu>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* FOOTER */}
        <div
          className={`p-6 border-t border-border/50 shrink-0 bg-card ${
            isMobile ? "block" : "hidden group-hover:block"
          }`}
        >
          <button className="w-full flex items-center justify-center gap-2 text-danger bg-danger/10 hover:bg-danger/20 py-3 rounded-lg font-bold transition-colors text-sm">
            <LogOut size={18} />
            Logout Account
          </button>
        </div>
      </aside>
    </>
  );
};

/* ---------- COMPONENTS ---------- */

const NavItem = ({ to, icon: Icon, label, onClick, isMobile }) => (
  <li>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-3.5 rounded-lg mb-1 transition-all duration-200 group/item relative overflow-hidden
        ${
          isActive
            ? "bg-primary text-white font-semibold shadow-sm" // Changed: Solid Blue Background, White Text
            : "text-text-sub hover:bg-page hover:text-text-main"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            // Changed: White indicator to contrast with blue background
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
          )}

          <Icon
            className={`w-5 h-5 mr-3 shrink-0 ${
              isActive
                ? "text-white" // Changed: White Icon
                : "text-text-sub group-hover/item:text-primary"
            }`}
          />

          {/* Label: Always visible on Mobile OR on Desktop Hover */}
          <span
            className={`truncate ${
              isMobile ? "inline" : "hidden group-hover:inline"
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  </li>
);

const MenuButton = ({
  label,
  icon: Icon,
  isOpen,
  isActive,
  onClick,
  isMobile,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg mb-1 transition-all duration-200 group/item
      ${
        isActive
          ? "bg-page text-text-main font-medium shadow-sm"
          : "text-text-sub hover:bg-page hover:text-text-main"
      }`}
  >
    <div className="flex items-center">
      <Icon
        className={`w-5 h-5 mr-3 ${
          isActive
            ? "text-primary"
            : "text-text-sub group-hover/item:text-primary"
        }`}
      />

      <span
        className={`truncate ${
          isMobile ? "inline" : "hidden group-hover:inline"
        }`}
      >
        {label}
      </span>
    </div>

    {/* Chevron: Always visible on Mobile OR on Desktop Hover */}
    <ChevronRight
      className={`w-4 h-4 text-text-sub transition-transform duration-300 ${
        isOpen ? "rotate-90" : ""
      } ${isMobile ? "inline" : "hidden group-hover:inline"}`}
    />
  </button>
);

const SubMenu = ({ isOpen, children, isMobile }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.ul
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`ml-5 pl-3 border-l-2 border-primary/20 overflow-hidden ${
          isMobile ? "block" : "hidden group-hover:block"
        }`}
      >
        {children}
      </motion.ul>
    )}
  </AnimatePresence>
);

const SubNavItem = ({ to, label, onClick, end = false }) => (
  <li>
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-4 py-2.5 text-[13px] rounded-r-lg transition-all duration-200
        ${
          isActive
            ? "text-primary font-bold bg-primary-light/50 border-l-2 border-primary -ml-[2px]"
            : "text-text-sub hover:text-text-main hover:bg-page"
        }`
      }
    >
      {label}
    </NavLink>
  </li>
);

export default Sidebar;
