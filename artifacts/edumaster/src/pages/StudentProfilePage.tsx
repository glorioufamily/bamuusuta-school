import { useParams, Link } from "wouter";
import { useGetStudentProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, MapPin, Calendar, Phone, Activity, Trophy, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentProfilePage() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data, isLoading } = useGetStudentProfile(id, { query: { enabled: !!id } });

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (!data) {
    return <div className="p-8">Student not found</div>;
  }

  const { student, marks, attendance, disciplineRecords, fees, ranking, timeline } = data;

  // Process data for charts
  const attendanceData = [
    { name: 'Present', value: attendance.filter(a => a.status === 'present').length, color: 'hsl(var(--chart-2))' },
    { name: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: 'hsl(var(--destructive))' },
    { name: 'Late', value: attendance.filter(a => a.status === 'late').length, color: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  const marksData = marks.map(m => ({
    subject: m.subject,
    score: m.percentage || (m.score / m.maxScore * 100)
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/students">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Left Column: Profile Card */}
        <Card className="md:col-span-1 border-t-4 border-t-primary shadow-md">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg mb-4">
              <AvatarImage src={student.photoUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
            <p className="text-muted-foreground font-medium mt-1">{student.className}</p>
            
            <div className="flex gap-2 mt-4">
              {ranking && (
                <Badge className="bg-accent text-accent-foreground px-3 py-1">
                  Rank #{ranking.rank}
                </Badge>
              )}
              {student.riskLevel && (
                <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'} className="px-3 py-1 capitalize">
                  {student.riskLevel} Risk
                </Badge>
              )}
            </div>

            <div className="w-full mt-6 space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center"><Calendar className="h-4 w-4 mr-2" /> DOB</span>
                <span className="font-medium text-foreground">{new Date(student.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center"><Phone className="h-4 w-4 mr-2" /> Parent Contact</span>
                <span className="font-medium text-foreground">{student.parentContact || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center"><Activity className="h-4 w-4 mr-2" /> Performance</span>
                <span className="font-medium text-foreground">{student.performanceScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Detailed Info Tabs */}
        <div className="md:col-span-2 lg:col-span-3">
          <Tabs defaultValue="academics" className="w-full">
            <TabsList className="grid grid-cols-4 bg-muted/50 p-1 rounded-xl h-auto">
              <TabsTrigger value="academics" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Academics</TabsTrigger>
              <TabsTrigger value="attendance" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Attendance</TabsTrigger>
              <TabsTrigger value="discipline" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Discipline</TabsTrigger>
              <TabsTrigger value="fees" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Fees</TabsTrigger>
            </TabsList>
            
            {/* Academics Tab */}
            <TabsContent value="academics" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" /> Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {marksData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={marksData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip 
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} 
                          />
                          <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">No marks recorded yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Marks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marks.length > 0 ? marks.map((mark) => (
                        <TableRow key={mark.id}>
                          <TableCell className="font-medium">{mark.term}</TableCell>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>{mark.score} / {mark.maxScore}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{mark.grade || '-'}</Badge>
                          </TableCell>
                          <TableCell>{mark.teacherName || '-'}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No marks available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full flex items-center justify-center">
                      {attendanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={attendanceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {attendanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-muted-foreground">No attendance data</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendance.slice(0, 5).map(record => (
                        <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                          <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                          <Badge className={
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                      {attendance.length === 0 && <div className="text-muted-foreground text-center py-4">No records found.</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Discipline Tab */}
            <TabsContent value="discipline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Disciplinary Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disciplineRecords.length > 0 ? (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {disciplineRecords.map((record) => (
                        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                            {record.severity === 'high' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : 
                             record.severity === 'medium' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : 
                             <Activity className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-foreground capitalize">{record.type}</div>
                              <time className="font-medium text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</time>
                            </div>
                            <div className="text-sm text-muted-foreground">{record.description}</div>
                            <div className="mt-2 flex gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase">Severity: {record.severity}</Badge>
                              <Badge variant={record.resolved ? "secondary" : "destructive"} className="text-[10px] uppercase">
                                {record.resolved ? 'Resolved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                      <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p>Clean disciplinary record.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.length > 0 ? fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.term}</TableCell>
                          <TableCell>${fee.totalAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">${fee.amountPaid.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive font-medium">${fee.balance.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              fee.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              fee.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {fee.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No fee records available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
