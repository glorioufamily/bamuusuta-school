import { useAuth } from "@/context/AuthContext";
import { 
  useGetDashboardSummary, 
  useGetSchoolHealth, 
  useGetAtRiskStudents, 
  useGetAnalyticsTrends,
  useListStudents,
  useListMarks,
  useGetAttendanceSummary,
  useGetFinancialReport,
  useListFees,
  useGetStudentProfile,
  useListAnnouncements,
  useGetStudentRankings
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { Users, GraduationCap, Calendar, CreditCard, AlertTriangle, TrendingUp, BookOpen, Activity, ArrowUpRight, Trophy, Eye, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";

export function DashboardPage() {
  const { role, user } = useAuth();

  if (role === "admin" || role === "headteacher") {
    return <AdminDashboard />;
  }
  if (role === "teacher") {
    return <TeacherDashboard />;
  }
  if (role === "bursar") {
    return <BursarDashboard />;
  }
  if (role === "student" || role === "parent") {
    return <StudentDashboard linkedId={user?.linkedId} />;
  }
  if (role === "dos") {
    return <DosDashboard />;
  }

  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Welcome to EduMaster 360</h2>
        <p className="text-muted-foreground mt-2">Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: health, isLoading: loadingHealth } = useGetSchoolHealth();
  const { data: atRisk, isLoading: loadingRisk } = useGetAtRiskStudents();
  const { data: trends, isLoading: loadingTrends } = useGetAnalyticsTrends();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard overview</h1>
          <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
        </div>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/students">
            <StatCard 
              title="Total Students" 
              value={summary?.totalStudents || 0} 
              icon={Users}
              className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
              description="View all students →"
            />
          </Link>
          <Link href="/intelligence?tab=attendance">
            <StatCard 
              title="Attendance Today" 
              value={`${summary?.attendanceToday || 0}%`} 
              icon={Calendar}
              className="border-l-4 border-l-chart-2 cursor-pointer hover:shadow-md transition-shadow"
              description="View attendance details →"
            />
          </Link>
          <Link href="/intelligence?tab=fees">
            <StatCard 
              title="Fees Collection" 
              value={`${summary?.feesCollectionRate || 0}%`} 
              icon={CreditCard}
              className="border-l-4 border-l-chart-3 cursor-pointer hover:shadow-md transition-shadow"
              description="View fees details →"
            />
          </Link>
          <Link href="/intelligence?tab=at-risk">
            <StatCard 
              title="At-Risk Students" 
              value={summary?.atRiskCount || 0} 
              icon={AlertTriangle}
              className="border-l-4 border-l-destructive cursor-pointer hover:shadow-md transition-shadow"
              description="View at-risk students →"
            />
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>School Health Status</CardTitle>
            <CardDescription>Overall performance across key metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {loadingHealth ? (
              <div className="h-48 animate-pulse bg-muted rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
                <ScoreCircle score={health?.academicScore || 0} label="Academic" size="md" />
                <ScoreCircle score={health?.attendanceScore || 0} label="Attendance" size="md" />
                <ScoreCircle score={health?.disciplineScore || 0} label="Discipline" size="md" />
                <ScoreCircle score={health?.financialScore || 0} label="Financial" size="md" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>At-Risk Students</CardTitle>
            <CardDescription>Students requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse bg-muted rounded" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {atRisk?.slice(0, 5).map(student => (
                  <Link key={student.id} href={`/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer group">
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.className}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'} className={student.riskLevel === 'high' ? '' : 'text-amber-600 bg-amber-100 border-amber-200'}>
                          {student.riskLevel}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
                {(!atRisk || atRisk.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No students currently flagged as at-risk.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loadingTrends ? (
                 <div className="w-full h-full animate-pulse bg-muted rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends?.attendanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="presentRate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingSummary ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />)
              ) : (
                summary?.recentActivity?.map(activity => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { data: attendance } = useGetAttendanceSummary();
  const { data: marks } = useListMarks({ params: { } });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your classes, marks, and attendance.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Overall Attendance" value={`${attendance?.presentRate || 0}%`} icon={Calendar} />
        <StatCard title="Recent Marks" value={marks?.length || 0} icon={BookOpen} />
      </div>
    </div>
  );
}

function BursarDashboard() {
  const { data: report } = useGetFinancialReport();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Dashboard</h1>
        <p className="text-muted-foreground">Track fee collections and financial health.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Expected Revenue" value={`$${report?.totalExpected.toLocaleString() || 0}`} icon={TrendingUp} />
        <StatCard title="Collected" value={`$${report?.totalCollected.toLocaleString() || 0}`} icon={CreditCard} />
        <StatCard title="Outstanding" value={`$${report?.totalOutstanding.toLocaleString() || 0}`} icon={AlertTriangle} />
        <StatCard title="Collection Rate" value={`${report?.collectionRate || 0}%`} icon={Activity} />
      </div>
    </div>
  );
}

function StudentDashboard({ linkedId }: { linkedId?: number | null }) {
  const { data: profile } = useGetStudentProfile(linkedId || 0, { query: { enabled: !!linkedId } });
  
  if (!linkedId) {
    return <div className="p-8 text-center text-muted-foreground">No student profile linked to this account.</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Portal</h1>
        <p className="text-muted-foreground">Welcome to your educational journey.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Overall Rank" value={`#${profile?.ranking?.rank || '-'}`} icon={Trophy} />
        <StatCard title="Academic Score" value={`${profile?.ranking?.academicScore || 0}%`} icon={GraduationCap} />
        <StatCard title="Attendance" value={`${profile?.ranking?.attendanceScore || 0}%`} icon={Calendar} />
      </div>
    </div>
  );
}

function DosDashboard() {
  const { data: health } = useGetSchoolHealth();
  const { data: rankings } = useGetStudentRankings({});
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Dashboard</h1>
        <p className="text-muted-foreground">Monitor academic performance and curriculum delivery.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Academic Health" value={`${health?.academicScore || 0}%`} icon={BookOpen} />
        <StatCard title="Top Scholars" value={rankings?.length || 0} icon={GraduationCap} />
      </div>
    </div>
  );
}
