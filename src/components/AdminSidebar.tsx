import React from "react";
import { NavLink } from "react-router-dom";
import {
  UserIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";

const sidebarLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-base font-medium",
    isActive
      ? "bg-emerald-100 text-emerald-800"
      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900",
  ].join(" ");

export default function AdminSidebar() {
  return (
    <aside className="hidden md:block w-64 min-h-screen bg-white border-r border-slate-200 pt-8">
      <nav className="flex flex-col gap-2 px-2">
        <NavLink to="/admin/users" className={sidebarLink}>
          <UserIcon className="h-5 w-5" />
          Users
        </NavLink>
        <NavLink to="/agents" className={sidebarLink}>
          <UsersIcon className="h-5 w-5" />
          Agents
        </NavLink>
        <NavLink to="/admin/contact-messages" className={sidebarLink}>
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          Contact Messages
        </NavLink>
        {/* Example: add more admin navigation links below */}
        {/* <NavLink to="/admin/activity" className={sidebarLink}>
          <ChartBarIcon className="h-5 w-5" />
          Activity
        </NavLink> */}
        <NavLink to="/" className={sidebarLink}>
          <HomeIcon className="h-5 w-5" />
          Site Home
        </NavLink>
        <NavLink to="/account" className={sidebarLink}>
          <Cog8ToothIcon className="h-5 w-5" />
          My Account
        </NavLink>
      </nav>
    </aside>
  );
}