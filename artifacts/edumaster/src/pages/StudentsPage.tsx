import { useState } from "react";
import { Link } from "wouter";
import { useListStudents, useListClasses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Filter, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export function StudentsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState<number | null>(null);

  const { data: students, isLoading } = useListStudents({ 
    params: { 
      search: search || undefined, 
      classId: classId || undefined 
    } 
  });
  
  const { data: classes } = useListClasses();
  
  const canAddStudent = ["admin", "headteacher", "dos"].includes(role || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Students Directory</h1>
          <p className="text-muted-foreground">Manage and view all student profiles.</p>
        </div>
        {canAddStudent && (
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        )}
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students by name..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select 
              value={classId ? classId.toString() : "all"} 
              onValueChange={(v) => setClassId(v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger className="bg-background">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-32" />
          ))}
        </div>
      ) : students && students.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/students/${student.id}`}>
                <Card className="hover-elevate cursor-pointer border-border/50 hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-6 flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={student.photoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-lg leading-tight text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {student.className || "Unassigned"}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        ID: {student.id}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3 pt-2">
                        {student.performanceScore && (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            Score: {student.performanceScore}%
                          </Badge>
                        )}
                        {student.riskLevel && (
                          <Badge 
                            variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'}
                            className={student.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                          >
                            Risk: {student.riskLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No students found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
