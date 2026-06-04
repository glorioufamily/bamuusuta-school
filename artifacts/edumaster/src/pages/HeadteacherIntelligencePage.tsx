import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useListClasses, useGetAtRiskStudents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert, Users, CreditCard, Calendar, ArrowRight, Search,
  AlertTriangle, CheckCircle, TrendingDown, Eye, GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

type DisciplineCase = {
  id: number; studentId: number; studentName: string | null; studentPhoto: string | null;
  className: string | null; type: string; description: string; date: string;
  severity: string; resolved: boolean; issuedBy: string | null;
};

type AttendanceRow = {
  studentId: number; name: string; photoUrl: string | null; className: string | null;
  attendanceRate: number; totalDays: number; presentCount: number; absentCount: number;
  lateCount: number; maxConsecutiveAbsences: number; concern: boolean;
};

type FeesRow = {
  studentId: number; name: string; photoUrl: string | null; className: string | null;
  totalExpected: number; totalPaid: number; balance: number; collectionRate: number;
  status: string; parentContact: string | null;
  termBreakdown: { term: string; total: number; paid: number; balance: number; status: string }[];
};

function useDisciplineInvestigation() {
  return useQuery<DisciplineCase[]>({
    queryKey: ["/api/intelligence/discipline"],
    queryFn: () => customFetch("/api/intelligence/discipline"),
  });
}

function useAttendanceInvestigation() {
  return useQuery<AttendanceRow[]>({
    queryKey: ["/api/intelligence/attendance"],
    queryFn: () => customFetch("/api/intelligence/attendance"),
  });
}

function useFeesInvestigation() {
  return useQuery<FeesRow[]>({
    queryKey: ["/api/intelligence/fees"],
    queryFn: () => customFetch("/api/intelligence/fees"),
  });
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = severity === "high"
    ? "bg-red-100 text-red-800 border-red-200"
    : severity === "medium"
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-blue-100 text-blue-800 border-blue-200";
  return <Badge variant="outline" className={`capitalize text-xs ${cfg}`}>{severity}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const cfg = type === "suspension" ? "bg-red-100 text-red-800" :
    type === "warning" ? "bg-amber-100 text-amber-800" :
    type === "commendation" ? "bg-emerald-100 text-emerald-800" :
    "bg-purple-100 text-purple-800";
  return <Badge className={`capitalize text-xs ${cfg}`}>{type}</Badge>;
}

function AttendanceBadge({ rate }: { rate: number }) {
  const cfg = rate >= 90 ? "bg-emerald-100 text-emerald-800" :
    rate >= 80 ? "bg-amber-100 text-amber-800" :
    "bg-red-100 text-red-800";
  return <Badge className={`text-xs ${cfg}`}>{rate}%</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === "paid" ? "bg-emerald-100 text-emerald-800" :
    status === "partial" ? "bg-amber-100 text-amber-800" :
    "bg-red-100 text-red-800";
  return <Badge className={`capitalize text-xs ${cfg}`}>{status}</Badge>;
}

// ─── Discipline Investigation Panel ───────────────────────────────────────────
function DisciplinePanel() {
  const { data, isLoading } = useDisciplineInvestigation();
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterResolved, setFilterResolved] = useState<string>("all");

  const incidents = data ?? [];
  const filtered = incidents.filter((d) => {
    const matchSearch = !search || d.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "all" || d.severity === filterSeverity;
    const matchResolved = filterResolved === "all" || (filterResolved === "open" ? !d.resolved : d.resolved);
    return matchSearch && matchSeverity && matchResolved;
  });

  const highCount = incidents.filter((d) => d.severity === "high" && !d.resolved).length;
  const openCount = incidents.filter((d) => d.type !== "commendation" && !d.resolved).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: incidents.filter(d => d.type !== "commendation").length, color: "border-l-primary" },
          { label: "Open Cases", value: openCount, color: "border-l-amber-500" },
          { label: "High Severity (Open)", value: highCount, color: "border-l-destructive" },
          { label: "Commendations", value: incidents.filter(d => d.type === "commendation").length, color: "border-l-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Discipline Cases</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student or incident..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filterResolved} onChange={(e) => setFilterResolved(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No incidents found.</TableCell></TableRow>
                ) : filtered.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border">
                          <AvatarImage src={d.studentPhoto || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{d.studentName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{d.studentName ?? "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.className ?? "—"}</TableCell>
                    <TableCell><TypeBadge type={d.type} /></TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={d.description}>{d.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString()}</TableCell>
                    <TableCell><SeverityBadge severity={d.severity} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.issuedBy ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={d.resolved ? "secondary" : "destructive"} className="text-xs">
                        {d.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${d.studentId}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-primary">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Attendance Investigation Panel ───────────────────────────────────────────
function AttendancePanel() {
  const { data, isLoading } = useAttendanceInvestigation();
  const [search, setSearch] = useState("");
  const [onlyConcerns, setOnlyConcerns] = useState(false);

  const rows = data ?? [];
  const filtered = rows.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.className?.toLowerCase().includes(search.toLowerCase());
    const matchConcern = !onlyConcerns || r.concern;
    return matchSearch && matchConcern;
  });

  const concernCount = rows.filter((r) => r.concern).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Students Tracked", value: rows.length, color: "border-l-primary" },
          { label: "Attendance Concerns", value: concernCount, color: "border-l-amber-500" },
          { label: "Below 65%", value: rows.filter(r => r.attendanceRate < 65).length, color: "border-l-destructive" },
          { label: "Perfect Attendance", value: rows.filter(r => r.attendanceRate === 100).length, color: "border-l-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant={onlyConcerns ? "default" : "outline"} size="sm" className="h-9" onClick={() => setOnlyConcerns(!onlyConcerns)}>
              <AlertTriangle className="h-4 w-4 mr-2" /> Concerns Only
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Max Consec. Absences</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No records found.</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.studentId} className={r.concern ? "bg-amber-50/30 hover:bg-amber-50/50" : "hover:bg-muted/30"}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border">
                          <AvatarImage src={r.photoUrl || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{r.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{r.name}</span>
                        {r.concern && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.className ?? "—"}</TableCell>
                    <TableCell><AttendanceBadge rate={r.attendanceRate} /></TableCell>
                    <TableCell className="text-sm text-emerald-700 font-medium">{r.presentCount}</TableCell>
                    <TableCell className="text-sm text-red-600 font-medium">{r.absentCount}</TableCell>
                    <TableCell className="text-sm text-amber-600 font-medium">{r.lateCount}</TableCell>
                    <TableCell>
                      {r.maxConsecutiveAbsences >= 3
                        ? <Badge className="bg-red-100 text-red-800 text-xs">{r.maxConsecutiveAbsences} days</Badge>
                        : <span className="text-sm text-muted-foreground">{r.maxConsecutiveAbsences}</span>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${r.studentId}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-primary">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Fees Investigation Panel ──────────────────────────────────────────────────
function FeesPanel() {
  const { data, isLoading } = useFeesInvestigation();
  const [search, setSearch] = useState("");

  const rows = data ?? [];
  const filtered = rows.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.className?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = rows.reduce((s, r) => s + r.balance, 0);
  const unpaidCount = rows.filter((r) => r.status === "unpaid").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fully Paid", value: rows.filter(r => r.status === "paid").length, color: "border-l-emerald-500" },
          { label: "Partial Payments", value: rows.filter(r => r.status === "partial").length, color: "border-l-amber-500" },
          { label: "No Payment", value: unpaidCount, color: "border-l-destructive" },
          { label: "Total Outstanding", value: `GHS ${totalOutstanding.toLocaleString()}`, color: "border-l-primary" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search student..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Expected (GHS)</TableHead>
                  <TableHead>Paid (GHS)</TableHead>
                  <TableHead>Balance (GHS)</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records found.</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.studentId} className={r.status === "unpaid" ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-muted/30"}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border">
                          <AvatarImage src={r.photoUrl || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{r.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.className ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{r.totalExpected.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-emerald-700 font-medium">{r.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className={`text-sm font-medium ${r.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>{r.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${r.collectionRate}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{r.collectionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.parentContact ?? "—"}</TableCell>
                    <TableCell>
                      <Link href={`/students/${r.studentId}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-primary">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── At-Risk Panel ────────────────────────────────────────────────────────────
function AtRiskPanel() {
  const { data, isLoading } = useGetAtRiskStudents();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "High Risk", value: data?.filter(s => s.riskLevel === "high").length ?? 0, color: "border-l-destructive" },
          { label: "Medium Risk", value: data?.filter(s => s.riskLevel === "medium").length ?? 0, color: "border-l-amber-500" },
          { label: "Total Flagged", value: data?.length ?? 0, color: "border-l-primary" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse bg-muted rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.map((student) => (
            <motion.div key={student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border-l-4 ${student.riskLevel === "high" ? "border-l-destructive" : "border-l-amber-500"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow">
                        <AvatarImage src={student.photoUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.className ?? "No class"}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {student.riskFactors?.map((f: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0.5">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={student.riskLevel === "high" ? "destructive" : "secondary"}
                        className={`capitalize ${student.riskLevel === "medium" ? "text-amber-700 bg-amber-100 border-amber-200" : ""}`}>
                        {student.riskLevel} risk
                      </Badge>
                      <Link href={`/students/${student.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Investigate <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {(!data || data.length === 0) && (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <p className="font-medium">No students currently at risk.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Class Quick-Links ────────────────────────────────────────────────────────
function ClassLinksPanel() {
  const { data: classes, isLoading } = useListClasses();

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 animate-pulse bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {classes?.map((cls) => (
            <Link key={cls.id} href={`/intelligence/class/${cls.id}`}>
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{cls.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.studentCount} students · {cls.year}</p>
                    {cls.teacherName && <p className="text-xs text-muted-foreground">{cls.teacherName}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-primary">{cls.averageScore ?? "—"}%</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function HeadteacherIntelligencePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Eye className="h-7 w-7 text-primary" /> Intelligence Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Drill down into student data. Investigate root causes. Take informed action.
          </p>
        </div>
      </div>

      <Tabs defaultValue="discipline" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-muted/50 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="discipline" className="py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-1.5 items-center">
            <ShieldAlert className="h-4 w-4" /> Discipline
          </TabsTrigger>
          <TabsTrigger value="attendance" className="py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-1.5 items-center">
            <Calendar className="h-4 w-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="fees" className="py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-1.5 items-center">
            <CreditCard className="h-4 w-4" /> Fees
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-1.5 items-center">
            <AlertTriangle className="h-4 w-4" /> At-Risk
          </TabsTrigger>
          <TabsTrigger value="classes" className="py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-1.5 items-center">
            <GraduationCap className="h-4 w-4" /> Classes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discipline" className="mt-4"><DisciplinePanel /></TabsContent>
        <TabsContent value="attendance" className="mt-4"><AttendancePanel /></TabsContent>
        <TabsContent value="fees" className="mt-4"><FeesPanel /></TabsContent>
        <TabsContent value="at-risk" className="mt-4"><AtRiskPanel /></TabsContent>
        <TabsContent value="classes" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Click a class to investigate its students in detail.</p>
            <ClassLinksPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
