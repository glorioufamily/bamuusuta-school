import { useParams, Link } from "wouter";
import { useGetStudentProfile } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowLeft, MapPin, Calendar, Phone, Activity, Trophy, AlertTriangle, ShieldCheck, Search, TrendingDown, TrendingUp, BookOpen, CreditCard, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentProfilePage() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data, isLoading } = useGetStudentProfile(id, { query: { enabled: !!id } });
  const { data: rootCause, isLoading: loadingRootCause } = useQuery({
    queryKey: ["/api/intelligence/root-cause", id],
    queryFn: () => customFetch(`/api/intelligence/root-cause/${id}`),
    enabled: !!id,
  });

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
            <TabsList className="grid grid-cols-5 bg-muted/50 p-1 rounded-xl h-auto">
              <TabsTrigger value="academics" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Academics</TabsTrigger>
              <TabsTrigger value="attendance" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Attendance</TabsTrigger>
              <TabsTrigger value="discipline" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Discipline</TabsTrigger>
              <TabsTrigger value="fees" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Fees</TabsTrigger>
              <TabsTrigger value="rootcause" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Root Cause
              </TabsTrigger>
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

            {/* Root Cause Analysis Tab */}
            <TabsContent value="rootcause" className="space-y-4 mt-6">
              {loadingRootCause ? (
                <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse bg-muted rounded-xl" />)}</div>
              ) : !rootCause ? (
                <div className="text-center py-12 text-muted-foreground">Unable to load root cause analysis.</div>
              ) : (
                <>
                  {/* Performance Trend */}
                  {(rootCause as any).termTrend?.length > 1 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {(rootCause as any).performanceDrop
                            ? <TrendingDown className="h-5 w-5 text-destructive" />
                            : <TrendingUp className="h-5 w-5 text-emerald-500" />}
                          Academic Trend
                          {(rootCause as any).performanceDrop && (
                            <Badge variant="destructive" className="text-xs ml-2">Performance Drop Detected</Badge>
                          )}
                        </CardTitle>
                        {(rootCause as any).dropDescription && (
                          <p className="text-sm text-muted-foreground">{(rootCause as any).dropDescription}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(rootCause as any).termTrend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="term" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', borderColor: 'hsl(var(--border))' }} />
                              <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Avg %" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Root Cause Factors */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" /> Identified Root Cause Factors
                    </h3>
                    {(rootCause as any).rootCauseFactors?.map((factor: any, i: number) => (
                      <Card key={i} className={`border-l-4 ${
                        factor.severity === 'high' ? 'border-l-destructive bg-red-50/30' :
                        factor.severity === 'medium' ? 'border-l-amber-400 bg-amber-50/20' :
                        'border-l-emerald-400 bg-emerald-50/20'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-foreground">{factor.factor}</span>
                                <Badge variant="outline" className={`text-[10px] capitalize ${
                                  factor.severity === 'high' ? 'border-red-300 text-red-700 bg-red-50' :
                                  factor.severity === 'medium' ? 'border-amber-300 text-amber-700 bg-amber-50' :
                                  'border-emerald-300 text-emerald-700 bg-emerald-50'
                                }`}>{factor.severity}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{factor.description}</p>
                              <div className="bg-background/80 rounded-lg p-2 border border-border/50">
                                <p className="text-xs font-medium text-foreground mb-0.5">Recommendation</p>
                                <p className="text-xs text-muted-foreground">{factor.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Subject Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" /> Academic Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(rootCause as any).strengths?.length > 0 ? (
                          <div className="space-y-2">
                            {(rootCause as any).strengths.map((s: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{s.subject}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.average}%` }} />
                                  </div>
                                  <span className="text-xs font-medium text-emerald-700 w-10 text-right">{s.average}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground py-2">No subjects above 70% yet.</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" /> Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(rootCause as any).weaknesses?.length > 0 ? (
                          <div className="space-y-2">
                            {(rootCause as any).weaknesses.map((w: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{w.subject}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${w.average}%` }} />
                                  </div>
                                  <span className="text-xs font-medium text-red-700 w-10 text-right">{w.average}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground py-2">No major subject weaknesses.</p>}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Teacher Remarks */}
                  {(rootCause as any).teacherRemarks?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" /> Teacher Remarks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(rootCause as any).teacherRemarks.map((r: any, i: number) => (
                            <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px]">{r.subject}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{r.term}</Badge>
                                  <span className="text-xs text-muted-foreground">{r.percentage}%</span>
                                </div>
                                <p className="text-sm text-muted-foreground italic">"{r.remark}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
