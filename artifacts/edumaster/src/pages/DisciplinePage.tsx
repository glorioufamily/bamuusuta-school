import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListDiscipline, useCreateDisciplineRecord, useUpdateDisciplineRecord, useListStudents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldAlert, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const disciplineSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  type: z.enum(["warning", "suspension", "commendation", "detention", "expulsion"]),
  severity: z.enum(["low", "medium", "high"]),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(5, "Description must be detailed"),
});

type DisciplineFormValues = z.infer<typeof disciplineSchema>;

export function DisciplinePage() {
  const { role } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: records, isLoading } = useListDiscipline();
  const { data: students } = useListStudents();
  
  const createMutation = useCreateDisciplineRecord();
  const updateMutation = useUpdateDisciplineRecord();

  const canEdit = ["admin", "headteacher", "dos", "teacher"].includes(role || "");

  const form = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: { studentId: 0, type: "warning", severity: "low", date: new Date().toISOString().split('T')[0], description: "" },
  });

  const onSubmit = (data: DisciplineFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Record created successfully");
        setIsAddOpen(false);
        form.reset({ ...form.getValues(), studentId: 0, description: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/discipline"] });
      },
      onError: (err) => toast.error("Failed to create record", { description: err.data?.error })
    });
  };

  const handleResolve = (id: number) => {
    updateMutation.mutate({ id, data: { resolved: true } }, {
      onSuccess: () => {
        toast.success("Incident marked as resolved");
        queryClient.invalidateQueries({ queryKey: ["/api/discipline"] });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Discipline Hub</h1>
          <p className="text-muted-foreground">Manage behavioral records and commendations.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Plus className="mr-2 h-4 w-4" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Discipline Record</DialogTitle></DialogHeader>
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="detention">Detention</SelectItem>
                              <SelectItem value="suspension">Suspension</SelectItem>
                              <SelectItem value="expulsion">Expulsion</SelectItem>
                              <SelectItem value="commendation">Commendation</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Record
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse bg-muted h-32" />)}
        </div>
      ) : records && records.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map(record => (
            <Card key={record.id} className={`border-l-4 ${record.type === 'commendation' ? 'border-l-emerald-500' : 'border-l-destructive'} shadow-sm`}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{record.studentName}</h3>
                    <Badge variant={record.type === 'commendation' ? 'outline' : 'secondary'} className={record.type === 'commendation' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'uppercase text-[10px]'}>
                      {record.type}
                    </Badge>
                    <Badge variant={record.severity === 'high' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                      {record.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 mb-4 flex-1">{record.description}</p>
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">By: {record.issuedBy || 'Staff'}</span>
                  {record.resolved ? (
                    <span className="flex items-center text-emerald-600 text-xs font-medium"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</span>
                  ) : canEdit && record.type !== 'commendation' ? (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(record.id)} disabled={updateMutation.isPending && updateMutation.variables?.id === record.id}>
                      Mark Resolved
                    </Button>
                  ) : (
                    <span className="text-destructive text-xs font-medium">Pending</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No discipline records</h3>
          <p className="text-sm text-muted-foreground mt-1">The school behavior record is clean.</p>
        </div>
      )}
    </div>
  );
}
