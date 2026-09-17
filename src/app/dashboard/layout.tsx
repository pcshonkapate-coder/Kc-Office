"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  Receipt,
  Building2,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Target,
  FileText,
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  group?: string;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard", group: "Main" },
  { icon: <TrendingUp size={18} />, label: "CRM", href: "/dashboard/crm", badge: "NEW", group: "Business" },
  { icon: <Target size={18} />, label: "Leads", href: "/dashboard/leads", group: "Business" },
  { icon: <Briefcase size={18} />, label: "Deals", href: "/dashboard/deals", group: "Business" },
  { icon: <Building2 size={18} />, label: "Companies", href: "/dashboard/companies", group: "Business" },
  { icon: <Users size={18} />, label: "Contacts", href: "/dashboard/contacts", group: "Business" },
  { icon: <FolderKanban size={18} />, label: "Projects", href: "/dashboard/projects", group: "Delivery" },
  { icon: <FileText size={18} />, label: "Tasks", href: "/dashboard/tasks", group: "Delivery" },
  { icon: <Clock size={18} />, label: "Timesheets", href: "/dashboard/timesheets", group: "Delivery" },
  { icon: <UserCheck size={18} />, label: "Workforce", href: "/dashboard/workforce", group: "HR" },
  { icon: <Calendar size={18} />, label: "Attendance", href: "/dashboard/attendance", group: "HR" },
  { icon: <Receipt size={18} />, label: "Finance", href: "/dashboard/finance", group: "Finance" },
  { icon: <BarChart3 size={18} />, label: "Reports", href: "/dashboard/reports", group: "System" },
  { icon: <Settings size={18} />, label: "Settings", href: "/dashboard/settings", group: "System" },
];

const groups = ["Main", "Business", "Delivery", "HR", "Finance", "System"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kapate_token");
    if (!token) {
      router.push("/");
      return;
    }
    try {
      const u = JSON.parse(localStorage.getItem("kapate_user") || "{}");
      setUser(u);
    } catch {}
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("kapate_token");
    localStorage.removeItem("kapate_user");
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "KA";
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: sidebarOpen ? "260px" : "64px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          zIndex: 50,
          position: "relative",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            padding: sidebarOpen ? "0 20px" : "0 14px",
            borderBottom: "1px solid var(--border-subtle)",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            <Zap size={18} color="white" fill="white" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                Kapate OS
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                v1.0 · Beta
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {groups.map((group) => {
            const groupItems = navItems.filter((i) => i.group === group);
            if (!groupItems.length) return null;
            return (
              <div key={group} style={{ marginBottom: "8px" }}>
                {sidebarOpen && (
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      padding: "8px 8px 4px",
                    }}
                  >
                    {group}
                  </div>
                )}
                {groupItems.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-item ${active ? "active" : ""}`}
                      style={{
                        justifyContent: sidebarOpen ? "flex-start" : "center",
                        padding: sidebarOpen ? "10px 12px" : "10px",
                        marginBottom: "2px",
                      }}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <span style={{ flexShrink: 0 }}>{item.icon}</span>
                      {sidebarOpen && (
                        <>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.badge && (
                            <span className="badge badge-primary" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User profile */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
          onClick={handleLogout}
          title="Logout"
        >
          <div className="avatar" style={{ width: "34px", height: "34px", fontSize: "0.75rem", flexShrink: 0 }}>
            {getInitials(user?.full_name || "KA")}
          </div>
          {sidebarOpen && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.full_name || "Admin"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {user?.role || "superadmin"}
                </div>
              </div>
              <LogOut size={14} color="var(--text-muted)" />
            </>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            height: "64px",
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: "16px",
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          {/* Toggle sidebar */}
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: "480px", position: "relative" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              className="input"
              placeholder="Search anything..."
              id="global-search"
              style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              id="notifications-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "8px",
                display: "flex",
                position: "relative",
              }}
            >
              <Bell size={16} />
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "7px",
                  height: "7px",
                  background: "#ef4444",
                  borderRadius: "50%",
                }}
              />
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: "320px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "12px",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 600, fontSize: "0.9rem" }}>
                  Notifications
                </div>
                {[
                  { text: "New lead: TechCorp Solutions", time: "2m ago", type: "info" },
                  { text: "Project Alpha milestone approved", time: "1h ago", type: "success" },
                  { text: "Invoice INV-0042 overdue", time: "3h ago", type: "warning" },
                ].map((n, i) => (
                  <div
                    key={i}
                    style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: "10px", alignItems: "flex-start" }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: n.type === "success" ? "#10b981" : n.type === "warning" ? "#f59e0b" : "#6366f1",
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{n.text}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <div className="avatar" style={{ width: "34px", height: "34px", fontSize: "0.75rem" }}>
              {getInitials(user?.full_name || "KA")}
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }} className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
