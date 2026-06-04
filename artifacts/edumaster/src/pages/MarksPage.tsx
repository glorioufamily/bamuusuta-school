import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListMarks, useCreateMark, useListStudents, useListClasses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Filter, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const markSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  subject: z.string().min(1, "Subject is required"),
  score: z.coerce.number().min(0, "Score must be positive"),
  maxScore: z.coerce.number().min(1, "Max score must be greater than 0"),
  term: z.string().min(1, "Term is required"),
  remarks: z.string().optional(),
});

type MarkFormValues = z.infer<typeof markSchema>;

export function MarksPage() {
  const { role } = useAuth();
  const [classId, setClassId] = useState<number | null>(null);
  const [term, setTerm] = useState<string>("Term 1");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: marks, isLoading: loadingMarks } = useListMarks({ params: { classId: classId || undefined, term } });
  const { data: classes } = useListClasses();
  const { data: students } = useListStudents({ params: { classId: classId || undefined } });
  const createMutation = useCreateMark();

  const canEdit = ["admin", "teacher", "dos", "headteacher"].includes(role || "");

  const form = useForm<MarkFormValues>({
    resolver: zodResolver(markSchema),
    defaultValues: { studentId: 0, subject: "", score: 0, maxScore: 100, term: "Term 1", remarks: "" },
  });

  const onSubmit = (data: MarkFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Mark recorded successfully");
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      },
      onError: (err) => toast.error("Failed to record mark", { description: err.data?.error })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Marks</h1>
          <p className="text-muted-foreground">Record and review student academic performance.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Record Mark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record New Mark</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {students?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.className})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Term 1">Term 1</SelectItem>
                              <SelectItem value="Term 2">Term 2</SelectItem>
                              <SelectItem value="Term 3">Term 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Mathematics" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="score" render={({ field }) => (
                      <FormItem><FormLabel>Score</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="maxScore" render={({ field }) => (
                      <FormItem><FormLabel>Out Of</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="remarks" render={({ field }) => (
                    <FormItem><FormLabel>Remarks (Optional)</FormLabel><FormControl><Input placeholder="Good progress..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Mark
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={classId ? classId.toString() : "all"} onValueChange={(v) => setClassId(v === "all" ? null : parseInt(v))}>
              <SelectTrigger className="bg-background"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-64">
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Select Term" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loadingMarks ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : marks && marks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map(mark => (
                  <TableRow key={mark.id}>
                    <TableCell className="font-medium">{mark.studentName}</TableCell>
                    <TableCell>{mark.subject}</TableCell>
                    <TableCell>{mark.term}</TableCell>
                    <TableCell>{mark.score} / {mark.maxScore} <span className="text-muted-foreground ml-2">({mark.percentage}%)</span></TableCell>
                    <TableCell><Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{mark.grade}</Badge></TableCell>
                    <TableCell>{mark.teacherName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No marks found for the selected filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
