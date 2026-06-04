import { useState } from "react";
import { Link } from "wouter";
import { useListTeachers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Mail, Phone, BarChart2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export function TeachersPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const { data: teachers, isLoading } = useListTeachers();

  const filteredTeachers = teachers?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const canAddTeacher = ["admin", "headteacher"].includes(role || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Teaching Staff</h1>
          <p className="text-muted-foreground">Manage school educators and staff members.</p>
        </div>
        {canAddTeacher && (
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        )}
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search teachers by name or subject..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-48" />
          ))}
        </div>
      ) : filteredTeachers && filteredTeachers.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/teachers/${teacher.id}`}>
                <Card className="hover-elevate cursor-pointer border-border/50 hover:border-primary/50 transition-colors h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16 border-2 border-secondary/20">
                        <AvatarImage src={teacher.photoUrl || undefined} />
                        <AvatarFallback className="bg-secondary/10 text-secondary text-xl font-serif italic">
                          {teacher.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight text-foreground truncate">{teacher.name}</h3>
                        <Badge variant="secondary" className="mt-1 bg-accent/20 text-accent-foreground hover:bg-accent/20">
                          {teacher.subject}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-auto text-sm text-muted-foreground">
                      {teacher.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                      {teacher.performanceScore != null && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <BarChart2 className="h-4 w-4 text-primary" /> Performance
                          </span>
                          <span className="font-bold text-primary">{teacher.performanceScore}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <p className="text-muted-foreground">No teachers found matching your search.</p>
        </div>
      )}
    </div>
  );
}
