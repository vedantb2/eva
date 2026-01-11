import { MobileNav } from "./MobileNav";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "Building2" },
  { name: "Contacts", href: "/dashboard/contacts", icon: "Users2" },
  { name: "Invoices", href: "/dashboard/invoices", icon: "FileText" },
  { name: "Projects", href: "/dashboard/projects", icon: "FolderKanban" },
  { name: "Tasks", href: "/dashboard/tasks", icon: "CheckSquare" },
  { name: "Sales", href: "/dashboard/sales", icon: "TrendingUp" },
  { name: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
  { name: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      <MobileNav navigation={navigation} />

      <div className="lg:pl-72">
        <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
