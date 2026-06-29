import {
  LayoutDashboard,
  Package,
  Users,
  Bell,
  MessageSquare,
  MessageCircle,
  User,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
};

export const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Package, label: "Products", hasDropdown: true },
  { icon: Users, label: "Cooperative", hasDropdown: true },
  { icon: Bell, label: "Notifications" },
  { icon: MessageSquare, label: "Messages" },
  { icon: MessageCircle, label: "Feedback" },
  { icon: User, label: "My Page", hasDropdown: true },
  { icon: UserCircle, label: "Profile", hasDropdown: true },
];

export const statsCards = [
  { title: "Total Products", value: "9", subtext: "+9 this month", icon: "📦", color: "bg-emerald-500" },
  { title: "Total Members", value: "24", subtext: "+3 this month", icon: "👥", color: "bg-blue-500" },
  { title: "Cooperatives", value: "5", subtext: "Active", icon: "🏢", color: "bg-violet-500" },
  { title: "Pending Orders", value: "12", subtext: "4 urgent", icon: "🛒", color: "bg-orange-500" },
  { title: "Revenue", value: "₱48K", subtext: "+12% vs last mo.", icon: "💰", color: "bg-teal-500" },
  { title: "Announcements", value: "3", subtext: "2 unread", icon: "📢", color: "bg-amber-500" },
];

export const cooperativeRows = [
  {
    cooperative: "Coco Bee Cooperative",
    sharedCapital: "1,000",
    target: "5,000",
    contributions: "0",
    members: "12",
  },
];

export const announcements = [
  {
    title: "Annual General Assembly",
    subtitle: "All members are invited to attend",
    date: "Jun 28, 2026",
  },
  {
    title: "New Product Listing",
    subtitle: "Organic honey now available",
    date: "Jun 22, 2026",
  },
  {
    title: "Membership Drive",
    subtitle: "Refer a member and earn rewards",
    date: "Jun 15, 2026",
  },
];

export const notifications = [
  { message: "We train to buy and sell my product", time: "Just now" },
  { message: "Payment approved for Member #1042", time: "2 hours ago" },
  { message: "New message from Cooperative Admin", time: "Yesterday" },
];

export const user = {
  name: "Aroldayson3",
  email: "aroldayson3@occdc.ph",
  role: "Super Admin",
  memberId: "MEM-2024-001",
  cooperative: "Coco Bee Cooperative",
  initials: "AR",
};
