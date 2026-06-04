import { useParams, Link } from "wouter";
import { useGetTeacher } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, BookOpen, Calendar, CheckSquare, Award } from "lucide-react";

export function TeacherDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { data: teacher, isLoading } = useGetTeacher(id, { query: { enabled: !!id } });

  if (isLoading) return <div className="p-8">Loading teacher profile...</div>;
  if (!teacher) return <div className="p-8">Teacher not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link href="/teachers">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teachers
          </Button>
        </Link>
      </div>

      <Card className="border-t-4 border-t-primary shadow-md overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-blue-900 w-full" />
        <CardContent className="px-6 sm:px-10 pb-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-12 mb-8">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl shrink-0 bg-background">
              <AvatarImage src={teacher.photoUrl || undefined} />
              <AvatarFallback className="bg-primary/5 text-primary text-5xl font-serif italic">
                {teacher.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2 pt-2 sm:pt-0">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{teacher.name}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-sm py-1 px-3">
                  {teacher.subject} Department
                </Badge>
                <Badge variant="outline" className="text-sm py-1 px-3 border-border/60 text-muted-foreground">
                  Joined {new Date(teacher.createdAt).getFullYear()}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none">Message</Button>
              <Button className="flex-1 sm:flex-none">Edit Profile</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md text-foreground"><Mail className="h-4 w-4" /></div>
                    <span className="font-medium">{teacher.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md text-foreground"><Phone className="h-4 w-4" /></div>
                    <span className="font-medium">{teacher.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-border/50 shadow-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                      <h4 className="text-2xl font-bold text-foreground">{teacher.performanceScore || 0}%</h4>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30 border-border/50 shadow-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                      <CheckSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                      <h4 className="text-2xl font-bold text-foreground">{teacher.attendanceRate || 0}%</h4>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30 border-border/50 shadow-none col-span-2">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-chart-3/10 text-chart-3 rounded-lg shrink-0">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Marks Submitted</p>
                        <h4 className="text-2xl font-bold text-foreground">{teacher.marksSubmitted || 0} records</h4>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">View Details</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
