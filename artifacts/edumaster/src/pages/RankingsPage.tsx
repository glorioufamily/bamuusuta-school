import { useState } from "react";
import { useGetStudentRankings, useGetClassRankings, useListClasses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown, Minus, Filter, Loader2, Medal } from "lucide-react";
import { motion } from "framer-motion";

export function RankingsPage() {
  const [classId, setClassId] = useState<number | null>(null);

  const { data: students, isLoading: loadingStudents } = useGetStudentRankings({ params: { classId: classId || undefined, limit: 50 } });
  const { data: classRanks, isLoading: loadingClasses } = useGetClassRankings();
  const { data: classes } = useListClasses();

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]";
      case 2: return "text-gray-400 fill-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.5)]";
      case 3: return "text-amber-700 fill-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]";
      default: return "text-transparent";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Excellence Rankings</h1>
          <p className="text-muted-foreground">Leaderboards for students and classes.</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={classId ? classId.toString() : "all"} onValueChange={(v) => setClassId(v === "all" ? null : parseInt(v))}>
            <SelectTrigger className="bg-background"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Ranking</SelectItem>
              {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top 3 Podium */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background shadow-md border-border/50">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-accent fill-accent" /> Top Scholars
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : students && students.length >= 3 ? (
                <div className="flex justify-center items-end h-64 gap-2 sm:gap-6 mt-4">
                  {/* Rank 2 */}
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/4 sm:w-32">
                    <Avatar className="h-16 w-16 border-4 border-gray-300 shadow-lg z-10 -mb-4 bg-background">
                      <AvatarImage src={students[1].photoUrl || undefined} />
                      <AvatarFallback>{students[1].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full h-32 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg border-x border-t border-gray-300 flex flex-col items-center justify-start pt-6 text-center">
                      <Medal className={getMedalColor(2)} size={24} />
                      <span className="font-bold mt-1 text-sm">{students[1].overallScore}%</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-auto mb-2 truncate px-1 w-full">{students[1].name.split(' ')[0]}</span>
                    </div>
                  </motion.div>
                  
                  {/* Rank 1 */}
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center w-1/3 sm:w-40 z-10">
                    <Avatar className="h-20 w-20 border-4 border-yellow-400 shadow-xl z-10 -mb-6 bg-background">
                      <AvatarImage src={students[0].photoUrl || undefined} />
                      <AvatarFallback>{students[0].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full h-40 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-lg border-x border-t border-yellow-400 flex flex-col items-center justify-start pt-8 text-center shadow-lg">
                      <Medal className={getMedalColor(1)} size={32} />
                      <span className="font-bold mt-1 text-base">{students[0].overallScore}%</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground mt-auto mb-2 truncate px-1 w-full">{students[0].name.split(' ')[0]}</span>
                    </div>
                  </motion.div>
                  
                  {/* Rank 3 */}
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center w-1/4 sm:w-32">
                    <Avatar className="h-16 w-16 border-4 border-amber-600 shadow-lg z-10 -mb-4 bg-background">
                      <AvatarImage src={students[2].photoUrl || undefined} />
                      <AvatarFallback>{students[2].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg border-x border-t border-amber-600/50 flex flex-col items-center justify-start pt-6 text-center">
                      <Medal className={getMedalColor(3)} size={24} />
                      <span className="font-bold mt-1 text-sm">{students[2].overallScore}%</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-auto mb-2 truncate px-1 w-full">{students[2].name.split(' ')[0]}</span>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Not enough data to display podium.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Student Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStudents ? <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.slice(3).map(student => (
                    <TableRow key={student.studentId}>
                      <TableCell className="text-center font-bold text-muted-foreground">{student.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photoUrl || undefined} />
                            <AvatarFallback className="text-xs">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-none">{student.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{student.className}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{student.overallScore}%</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">{getTrendIcon(student.trend)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Class Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingClasses ? <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classRanks?.map(cls => (
                    <TableRow key={cls.classId}>
                      <TableCell className="text-center font-bold">{cls.rank}</TableCell>
                      <TableCell>
                        <p className="font-medium leading-none">{cls.className}</p>
                        <p className="text-xs text-muted-foreground mt-1">{cls.studentCount} std</p>
                      </TableCell>
                      <TableCell className="text-right font-bold">{cls.averageScore}%</TableCell>
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
