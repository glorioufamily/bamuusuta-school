import { useState } from "react";
import { useListClasses, useCreateClass, useListTeachers } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, GraduationCap, Trophy, Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  year: z.string().min(1, "Year is required"),
  teacherId: z.coerce.number().nullable().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

export function ClassesPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data: classes, isLoading } = useListClasses();
  const { data: teachers } = useListTeachers();
  const createMutation = useCreateClass();

  const filteredClasses = classes?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.year.includes(search)
  );

  const canAdd = ["admin", "headteacher", "dos"].includes(role || "");

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", year: new Date().getFullYear().toString(), teacherId: null },
  });

  const onSubmit = (data: ClassFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Class created successfully");
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      },
      onError: (err) => toast.error("Failed to create class", { description: err.data?.error })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Classes Overview</h1>
          <p className="text-muted-foreground">Manage academic classes and their performance.</p>
        </div>
        
        {canAdd && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Senior 1A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl><Input placeholder="e.g. 2025" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Teacher</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val ? Number(val) : null)} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map(t => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.subject})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Class
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search classes..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="animate-pulse bg-muted h-48" />)}
        </div>
      ) : filteredClasses && filteredClasses.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClasses.map(cls => (
            <Card key={cls.id} className="hover-elevate transition-colors border-border/50 hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">{cls.year}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Teacher: <span className="font-medium text-foreground">{cls.teacherName || 'Unassigned'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="font-bold text-foreground">{cls.studentCount || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                      <p className="font-bold text-foreground">{cls.averageScore || 0}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No classes found</h3>
          <p className="text-sm text-muted-foreground mt-1">Add a class to get started.</p>
        </div>
      )}
    </div>
  );
}
