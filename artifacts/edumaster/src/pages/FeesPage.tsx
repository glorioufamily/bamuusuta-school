import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListFees, useGetFinancialReport, useCreateFeeRecord, useListStudents } from "@workspace/api-client-react";
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
import { CreditCard, Plus, Filter, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const feeSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  term: z.string().min(1, "Term is required"),
  totalAmount: z.coerce.number().min(1, "Total amount must be greater than 0"),
  amountPaid: z.coerce.number().min(0, "Amount paid must be 0 or positive"),
  notes: z.string().optional(),
});

type FeeFormValues = z.infer<typeof feeSchema>;

export function FeesPage() {
  const { role } = useAuth();
  const [termFilter, setTermFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: fees, isLoading: loadingFees } = useListFees({ params: { term: termFilter === "all" ? undefined : termFilter } });
  const { data: report, isLoading: loadingReport } = useGetFinancialReport();
  const { data: students } = useListStudents();
  const createMutation = useCreateFeeRecord();

  const canEdit = ["admin", "bursar", "headteacher"].includes(role || "");

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: { studentId: 0, term: "Term 1", totalAmount: 500, amountPaid: 0, notes: "" },
  });

  const onSubmit = (data: FeeFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Fee record created");
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/fees/report"] });
      },
      onError: (err) => toast.error("Failed to create record", { description: err.data?.error })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fees & Finance</h1>
          <p className="text-muted-foreground">Manage school fee collections and balances.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Fee Record</DialogTitle></DialogHeader>
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="totalAmount" render={({ field }) => (
                      <FormItem><FormLabel>Total Amount ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="amountPaid" render={({ field }) => (
                      <FormItem><FormLabel>Amount Paid ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Input placeholder="Payment method..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Payment
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Total Expected</p>
            <h3 className="text-2xl font-bold">${report?.totalExpected.toLocaleString() || 0}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col justify-center border-l-4 border-emerald-500">
            <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
            <h3 className="text-2xl font-bold text-emerald-600">${report?.totalCollected.toLocaleString() || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">{report?.collectionRate || 0}% collection rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col justify-center border-l-4 border-destructive">
            <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
            <h3 className="text-2xl font-bold text-destructive">${report?.totalOutstanding.toLocaleString() || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">{report?.unpaidCount || 0} students unpaid</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Fully Paid</p>
            <h3 className="text-2xl font-bold text-foreground">{report?.fullyPaidCount || 0} Students</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="bg-background"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="All Terms" /></SelectTrigger>
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
          {loadingFees ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : fees && fees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map(fee => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.studentName}</TableCell>
                    <TableCell>{fee.term}</TableCell>
                    <TableCell>${fee.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">${fee.amountPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-destructive font-medium">${fee.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={
                        fee.status === 'paid' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                        fee.status === 'unpaid' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                        'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      }>
                        {fee.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No fee records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
