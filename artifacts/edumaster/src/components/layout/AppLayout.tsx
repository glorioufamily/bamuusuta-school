import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CheckSquare, 
  CreditCard, 
  ShieldAlert, 
  Bell, 
  MessageSquare, 
  BarChart, 
  Trophy,
  LogOut,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getNavItems(role: string | null) {
  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "headteacher", "dos", "teacher", "bursar", "student", "parent"] },
  ];

  if (role === "admin" || role === "headteacher") {
    items.push(
      { title: "Students", url: "/students", icon: Users, roles: ["admin", "headteacher"] },
      { title: "Teachers", url: "/teachers", icon: BookOpen, roles: ["admin", "headteacher"] },
      { title: "Classes", url: "/classes", icon: GraduationCap, roles: ["admin", "headteacher"] },
      { title: "Analytics", url: "/analytics", icon: BarChart, roles: ["admin", "headteacher"] },
      { title: "Rankings", url: "/rankings", icon: Trophy, roles: ["admin", "headteacher"] },
      { title: "Suggestions", url: "/suggestions", icon: MessageSquare, roles: ["admin", "headteacher"] },
    );
  }

  if (role === "headteacher") {
    items.push(
      { title: "Intelligence Center", url: "/intelligence", icon: Eye, roles: ["headteacher"] },
    );
  }

  if (role === "dos") {
    items.push(
      { title: "Students", url: "/students", icon: Users, roles: ["dos"] },
      { title: "Classes", url: "/classes", icon: GraduationCap, roles: ["dos"] },
      { title: "Announcements", url: "/announcements", icon: Bell, roles: ["dos"] },
      { title: "Rankings", url: "/rankings", icon: Trophy, roles: ["dos"] },
    );
  }

  if (role === "teacher") {
    items.push(
      { title: "Students", url: "/students", icon: Users, roles: ["teacher"] },
      { title: "Marks", url: "/marks", icon: BookOpen, roles: ["teacher"] },
      { title: "Attendance", url: "/attendance", icon: CheckSquare, roles: ["teacher"] },
      { title: "Discipline", url: "/discipline", icon: ShieldAlert, roles: ["teacher"] },
    );
  }

  if (role === "bursar") {
    items.push(
      { title: "Fees", url: "/fees", icon: CreditCard, roles: ["bursar"] },
      { title: "Students", url: "/students", icon: Users, roles: ["bursar"] },
    );
  }

  return items;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, logout } = useAuth();
  const [location] = useLocation();
  const navItems = getNavItems(role);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <Sidebar className="border-r bg-sidebar">
          <SidebarHeader className="border-b border-border/10 p-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                E
              </div>
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">EduMaster 360</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.startsWith(item.url)}>
                        <Link href={item.url} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border/20">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground leading-none">{user?.name}</span>
                  <span className="text-xs text-sidebar-foreground/60 capitalize mt-1">{user?.role}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
