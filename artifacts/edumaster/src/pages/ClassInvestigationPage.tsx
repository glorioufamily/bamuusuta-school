import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, AlertTriangle, CheckCircle, TrendingDown, Users, Trophy, Calendar, CreditCard, Eye } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

type ClassInvestigationData = {
  class: {
    id: number; name: string; year: string;
    teacherName: string | null; teacherSubject: string | null; studentCount: number;
  };
  students: Array<{
    id: number; name: string; photoUrl: string | null; gender: string;
    riskLevel: string | null; riskScore: number; performanceScore: number;
    avgMarkPercentage: number | null; attendanceRate: number | null;
    totalDisciplineIncidents: number; openDisciplineIncidents: number;
    feesBalance: number; feesStatus: string;
    recentDiscipline: { id: number; type: string; severity: string; description: string; date: string; resolved: boolean }[];
    recentMarks: { subject: string; score: number; maxScore: number; percentage: number; term: string; remarks: string | null }[];
    marksCount: number; attendanceCount: number;
  }>;
};

function useClassInvestigation(classId: number) {
  return useQuery<ClassInvestigationData>({
    queryKey: ["/api/intelligence/class", classId],
    queryFn: () => customFetch(`/api/intelligence/class/${classId}`),
    enabled: !!classId,
  });
}

function ScoreBar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level || level === "low") return <Badge className="bg-emerald-100 text-emerald-800 text-xs capitalize">{level ?? "low"}</Badge>;
  if (level === "medium") return <Badge className="bg-amber-100 text-amber-800 text-xs capitalize">medium</Badge>;
  return <Badge variant="destructive" className="text-xs">high</Badge>;
}

export function ClassInvestigationPage() {
  const params = useParams<{ id: string }>();
  const classId = parseInt(params.id || "0");
  const { data, isLoading } = useClassInvestigation(classId);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"performance" | "attendance" | "discipline" | "fees">("performance");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 animate-pulse bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-muted-foreground">Class not found.</div>;

  const cls = data.class;
  const students = data.students;

  const filtered = students
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "performance") return (b.avgMarkPercentage ?? 0) - (a.avgMarkPercentage ?? 0);
      if (sortBy === "attendance") return (b.attendanceRate ?? 0) - (a.attendanceRate ?? 0);
      if (sortBy === "discipline") return b.totalDisciplineIncidents - a.totalDisciplineIncidents;
      if (sortBy === "fees") return b.feesBalance - a.feesBalance;
      return 0;
    });

  const avgPerf = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.avgMarkPercentage ?? 0), 0) / students.length * 10) / 10
    : 0;
  const avgAtt = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.attendanceRate ?? 0), 0) / students.length * 10) / 10
    : 0;
  const totalIncidents = students.reduce((s, st) => s + st.totalDisciplineIncidents, 0);
  const atRiskCount = students.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/intelligence">
          <Button variant="ghost" size="sm" className="mb-3 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Intelligence Center
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{cls.name} — Class Investigation</h1>
            <p className="text-muted-foreground mt-1">
              {cls.year} · {cls.studentCount} students
              {cls.teacherName && <> · Class Teacher: <span className="font-medium text-foreground">{cls.teacherName}</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* Class Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Performance", value: `${avgPerf}%`, icon: Trophy, color: "border-l-primary" },
          { label: "Avg Attendance", value: `${avgAtt}%`, icon: Calendar, color: "border-l-chart-2" },
          { label: "Discipline Incidents", value: totalIncidents, icon: AlertTriangle, color: "border-l-amber-500" },
          { label: "At-Risk Students", value: atRiskCount, icon: Users, color: "border-l-destructive" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <s.icon className="h-8 w-8 text-muted-foreground/60" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search student..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["performance", "attendance", "discipline", "fees"] as const).map((s) => (
            <Button key={s} variant={sortBy === s ? "default" : "outline"} size="sm" className="h-9 capitalize" onClick={() => setSortBy(s)}>
              {s === "performance" && <Trophy className="h-3.5 w-3.5 mr-1.5" />}
              {s === "attendance" && <Calendar className="h-3.5 w-3.5 mr-1.5" />}
              {s === "discipline" && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
              {s === "fees" && <CreditCard className="h-3.5 w-3.5 mr-1.5" />}
              Sort by {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((student, idx) => (
          <motion.div key={student.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <Card className={`hover:shadow-md transition-all border-border/60 ${student.riskLevel === "high" ? "border-l-4 border-l-destructive" : student.riskLevel === "medium" ? "border-l-4 border-l-amber-400" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-background shadow">
                      <AvatarImage src={student.photoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">{student.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{student.gender}</p>
                    </div>
                  </div>
                  <RiskBadge level={student.riskLevel} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Academic Performance */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3 w-3" /> Academic</span>
                    <span className="text-xs font-medium">{student.avgMarkPercentage !== null ? `${student.avgMarkPercentage}%` : "No data"}</span>
                  </div>
                  <ScoreBar value={student.avgMarkPercentage ?? 0} color={
                    (student.avgMarkPercentage ?? 0) >= 70 ? "bg-emerald-500" :
                    (student.avgMarkPercentage ?? 0) >= 50 ? "bg-amber-500" : "bg-red-500"
                  } />
                </div>

                {/* Attendance */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Attendance</span>
                    <span className="text-xs font-medium">{student.attendanceRate !== null ? `${student.attendanceRate}%` : "No data"}</span>
                  </div>
                  <ScoreBar value={student.attendanceRate ?? 0} color={
                    (student.attendanceRate ?? 0) >= 90 ? "bg-emerald-500" :
                    (student.attendanceRate ?? 0) >= 75 ? "bg-amber-500" : "bg-red-500"
                  } />
                </div>

                {/* Indicators row */}
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5 flex-1">
                    <AlertTriangle className={`h-3.5 w-3.5 ${student.openDisciplineIncidents > 0 ? "text-amber-500" : "text-muted-foreground/40"}`} />
                    <span className="text-xs text-muted-foreground">
                      {student.totalDisciplineIncidents} case{student.totalDisciplineIncidents !== 1 ? "s" : ""}
                      {student.openDisciplineIncidents > 0 && <span className="text-amber-600 font-medium"> ({student.openDisciplineIncidents} open)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className={`h-3.5 w-3.5 ${student.feesBalance > 0 ? "text-red-500" : "text-muted-foreground/40"}`} />
                    <span className={`text-xs ${student.feesBalance > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      {student.feesBalance > 0 ? `GHS ${student.feesBalance.toLocaleString()} owed` : "Paid up"}
                    </span>
                  </div>
                </div>

                {/* Recent remarks */}
                {student.recentMarks.some((m) => m.remarks) && (
                  <div className="pt-1 border-t border-border/50">
                    {student.recentMarks.filter((m) => m.remarks).slice(0, 1).map((m, i) => (
                      <p key={i} className="text-xs text-muted-foreground italic">
                        "{m.remarks}" — {m.subject}
                      </p>
                    ))}
                  </div>
                )}

                <Link href={`/students/${student.id}`}>
                  <Button variant="outline" size="sm" className="w-full h-8 mt-1 text-xs group">
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-primary" /> View Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p>No students found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
