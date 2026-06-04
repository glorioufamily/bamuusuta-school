import { useGetSchoolHealth, useGetAtRiskStudents, useGetTeacherPerformance, useGetAnalyticsTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

export function AnalyticsPage() {
  const { data: health, isLoading: loadingHealth } = useGetSchoolHealth();
  const { data: atRisk, isLoading: loadingRisk } = useGetAtRiskStudents();
  const { data: teachers, isLoading: loadingTeachers } = useGetTeacherPerformance();
  const { data: trends, isLoading: loadingTrends } = useGetAnalyticsTrends();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Center</h1>
        <p className="text-muted-foreground">Deep insights into school performance and health.</p>
      </div>

      {/* Health Gauges */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Global Health Indices</CardTitle>
          <CardDescription>Real-time metrics based on 30-day moving averages</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <div className="h-32 flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 justify-items-center">
              <ScoreCircle score={health?.overallScore || 0} label="Overall" size="lg" className="md:col-span-1 col-span-2 text-primary" />
              <ScoreCircle score={health?.academicScore || 0} label="Academic" size="md" />
              <ScoreCircle score={health?.attendanceScore || 0} label="Attendance" size="md" />
              <ScoreCircle score={health?.disciplineScore || 0} label="Discipline" size="md" />
              <ScoreCircle score={health?.financialScore || 0} label="Financial" size="md" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Academic Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {loadingTrends ? <Loader2 className="animate-spin h-6 w-6 m-auto mt-20 text-muted-foreground" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends?.academicTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="term" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="averageScore" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {loadingTrends ? <Loader2 className="animate-spin h-6 w-6 m-auto mt-20 text-muted-foreground" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends?.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="presentRate" name="Present %" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="absentRate" name="Absent %" stroke="hsl(var(--destructive))" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Discipline Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {loadingTrends ? <Loader2 className="animate-spin h-6 w-6 m-auto mt-20 text-muted-foreground" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends?.disciplineTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} />
                    <Bar dataKey="incidents" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>At-Risk Watchlist</CardTitle>
            <CardDescription>Students requiring intervention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRisk ? <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRisk?.slice(0, 5).map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name} <div className="text-xs text-muted-foreground">{student.className}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'} className={student.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : ''}>
                          {student.riskScore}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {student.riskFactors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!atRisk || atRisk.length === 0) && <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No students on watchlist</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Teacher Performance</CardTitle>
            <CardDescription>Top performers by composite score</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTeachers ? <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers?.slice(0, 5).map(teacher => (
                    <TableRow key={teacher.teacherId}>
                      <TableCell className="font-medium">
                        {teacher.name} <div className="text-xs text-muted-foreground">{teacher.subject}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${teacher.performanceScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{teacher.performanceScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{teacher.studentPassRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
