import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListAttendance, useGetAttendanceSummary, useRecordAttendance, useListStudents, useListClasses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Plus, Filter, Loader2, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const attendanceSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
  reason: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export function AttendancePage() {
  const { role } = useAuth();
  const [classId, setClassId] = useState<number | null>(null);
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: records, isLoading: loadingRecords } = useListAttendance({ params: { classId: classId || undefined, date: dateStr } });
  const { data: summary, isLoading: loadingSummary } = useGetAttendanceSummary();
  const { data: classes } = useListClasses();
  const { data: students } = useListStudents({ params: { classId: classId || undefined } });
  const recordMutation = useRecordAttendance();

  const canEdit = ["admin", "teacher", "dos", "headteacher"].includes(role || "");

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { studentId: 0, date: new Date().toISOString().split('T')[0], status: "present", reason: "" },
  });

  const onSubmit = (data: AttendanceFormValues) => {
    recordMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Attendance recorded");
        setIsAddOpen(false);
        form.reset({ ...form.getValues(), studentId: 0 }); // keep date/status
        queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      },
      onError: (err) => toast.error("Failed to record attendance", { description: err.data?.error })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Tracker</h1>
          <p className="text-muted-foreground">Monitor student daily presence and absence.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Student Attendance</DialogTitle></DialogHeader>
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
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem><FormLabel>Reason (Optional)</FormLabel><FormControl><Input placeholder="If absent/late..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={recordMutation.isPending}>
                    {recordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Record
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Present Rate</p><p className="text-2xl font-bold text-emerald-600">{summary?.presentRate || 0}%</p></div>
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><CheckSquare className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Absent Rate</p><p className="text-2xl font-bold text-destructive">{summary?.absentRate || 0}%</p></div>
            <div className="p-2 bg-red-100 rounded-full text-destructive"><CheckSquare className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Late Rate</p><p className="text-2xl font-bold text-amber-600">{summary?.lateRate || 0}%</p></div>
            <div className="p-2 bg-amber-100 rounded-full text-amber-600"><CheckSquare className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total Days</p><p className="text-2xl font-bold text-foreground">{summary?.totalDays || 0}</p></div>
            <div className="p-2 bg-primary/10 rounded-full text-primary"><Calendar className="h-5 w-5" /></div>
          </CardContent>
        </Card>
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
            <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="bg-background" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loadingRecords ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : records && records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {record.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No attendance records found for the selected date.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
