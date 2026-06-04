import { useListAnnouncements, useGetStudentRankings, useGetClassRankings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, BookOpen, Users, Star, ArrowRight, ShieldCheck, MapPin, Bell } from "lucide-react";
import { format } from "date-fns";

export function LandingPage() {
  const { data: announcements, isLoading: loadingAnnouncements } = useListAnnouncements({ params: { visibility: "public" } });
  const { data: topStudents, isLoading: loadingStudents } = useGetStudentRankings({ params: { limit: 5 } });
  const { data: classRankings, isLoading: loadingClasses } = useGetClassRankings();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
              GA
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">Greenfield Academy</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button>Staff Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 z-0" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm font-medium backdrop-blur">
                <Star className="mr-2 h-4 w-4 fill-accent text-accent" />
                Excellence in Education
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Nurturing Tomorrow's Leaders Today
              </h1>
              <p className="max-w-[42rem] leading-normal text-primary-foreground/80 sm:text-xl sm:leading-8">
                Greenfield Academy is a premier educational institution committed to academic excellence, character development, and holistic growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-primary font-bold">
                  Admissions Open
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 space-y-20">
          {/* Announcements */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Latest Announcements</h2>
              <Button variant="ghost" className="hidden sm:flex">View all <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            
            {loadingAnnouncements ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : announcements && announcements.length > 0 ? (
              <motion.div 
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {announcements.map((announcement) => (
                  <motion.div key={announcement.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col hover-elevate">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className="capitalize text-primary bg-primary/10">
                            {announcement.category}
                          </Badge>
                          {announcement.pinned && (
                            <Badge variant="default" className="bg-accent text-accent-foreground">Pinned</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl line-clamp-2">{announcement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-muted-foreground line-clamp-3 text-sm">{announcement.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-foreground">No recent announcements</h3>
                <p className="text-sm text-muted-foreground">Check back later for updates from the school.</p>
              </div>
            )}
          </section>

          {/* Excellence Board */}
          <section className="bg-secondary/30 -mx-4 md:-mx-6 px-4 md:px-6 py-12 md:py-20 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Wall of Excellence</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Celebrating outstanding academic achievements across Greenfield Academy.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Top Students */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Top Scholars</h3>
                </div>
                
                {loadingStudents ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topStudents?.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between p-4 bg-background rounded-xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-slate-200 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-primary/5 text-primary'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.className}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{student.overallScore}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Top Classes */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-accent/20 rounded-lg text-accent-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Leading Classes</h3>
                </div>
                
                {loadingClasses ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classRankings?.slice(0, 3).map((cls, index) => (
                      <div key={cls.classId} className="p-5 bg-background rounded-xl shadow-sm border border-border/50 hover:border-accent/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                            {cls.className}
                            {index === 0 && <Star className="h-4 w-4 fill-accent text-accent" />}
                          </h4>
                          <Badge variant="outline" className="bg-primary/5">Rank #{cls.rank}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Score</p>
                            <p className="font-bold text-foreground">{cls.averageScore}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Attendance</p>
                            <p className="font-bold text-foreground">{cls.attendanceRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Students</p>
                            <p className="font-bold text-foreground">{cls.studentCount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          {/* Features / Stats */}
          <section className="py-10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="p-4 bg-primary/10 text-primary rounded-full">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Rigorous Curriculum</h3>
                <p className="text-muted-foreground text-sm">Comprehensive syllabus designed to challenge and inspire students.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="p-4 bg-accent/20 text-accent-foreground rounded-full">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Discipline & Values</h3>
                <p className="text-muted-foreground text-sm">Fostering strong moral character and ethical leadership.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="p-4 bg-chart-3/10 text-chart-3 rounded-full">
                  <Trophy className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Extra-Curricular</h3>
                <p className="text-muted-foreground text-sm">Rich sports and arts programs for holistic development.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="p-4 bg-chart-5/10 text-chart-5 rounded-full">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Modern Campus</h3>
                <p className="text-muted-foreground text-sm">State-of-the-art facilities located in a serene environment.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                GA
              </div>
              <span className="text-xl font-bold tracking-tight">Greenfield Academy</span>
            </div>
            <p className="text-secondary-foreground/70 text-sm max-w-xs">
              Empowering the next generation with knowledge, skills, and character to lead and succeed.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>123 Education Way</li>
              <li>Cityville, District 4</li>
              <li>info@greenfieldacademy.edu</li>
              <li>+1 234 567 890</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">System</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Powered by EduMaster 360</li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Staff & Student Portal</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-secondary-foreground/10 text-center text-sm text-secondary-foreground/50">
          &copy; {new Date().getFullYear()} Greenfield Academy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
