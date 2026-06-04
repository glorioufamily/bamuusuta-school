import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCreateSuggestion, useListSuggestions, useUpdateSuggestion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const suggestionSchema = z.object({
  category: z.enum(["academic", "facilities", "discipline", "welfare", "management", "other"]),
  message: z.string().min(10, "Please provide more details"),
  anonymous: z.boolean().default(false),
});

type SuggestionFormValues = z.infer<typeof suggestionSchema>;

export function SuggestionsPage() {
  const { role } = useAuth();
  const isAdmin = ["admin", "headteacher"].includes(role || "");
  
  const { data: suggestions, isLoading } = useListSuggestions({ query: { enabled: isAdmin } });
  const createMutation = useCreateSuggestion();
  const updateMutation = useUpdateSuggestion();

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: { category: "academic", message: "", anonymous: false },
  });

  const onSubmit = (data: SuggestionFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Suggestion submitted securely");
        form.reset();
        if (isAdmin) queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      },
      onError: (err) => toast.error("Failed to submit", { description: err.data?.error })
    });
  };

  const handleStatusChange = (id: number, status: "pending" | "reviewed" | "resolved") => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast.success("Status updated");
        queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Suggestion Box</h1>
        <p className="text-muted-foreground">Share feedback to improve our school community.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Submit Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="facilities">Facilities</SelectItem>
                          <SelectItem value="discipline">Discipline</SelectItem>
                          <SelectItem value="welfare">Welfare</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Your Message</FormLabel><FormControl><Textarea rows={5} placeholder="I suggest we..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="anonymous" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Submit Anonymously</FormLabel>
                      <p className="text-xs text-muted-foreground">Your identity will be hidden from staff.</p>
                    </div>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Feedback
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Inbox</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Card key={i} className="animate-pulse bg-muted h-24" />)}
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map(s => (
                  <Card key={s.id} className={`border-l-4 ${s.status === 'resolved' ? 'border-l-emerald-500 opacity-70' : s.status === 'reviewed' ? 'border-l-primary' : 'border-l-amber-500'} shadow-sm`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="capitalize">{s.category}</Badge>
                          <Badge variant={s.priority === 'high' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">{s.priority}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium mt-2">{s.message}</p>
                      <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">From: {s.anonymous ? 'Anonymous' : s.senderName}</span>
                        <div className="flex gap-2">
                          {s.status === 'pending' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'reviewed')}>Mark Reviewed</Button>}
                          {s.status !== 'resolved' && <Button size="sm" onClick={() => handleStatusChange(s.id, 'resolved')}>Resolve</Button>}
                          {s.status === 'resolved' && <span className="text-emerald-600 font-medium flex items-center"><CheckCircle2 className="mr-1 w-3 h-3" /> Resolved</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground">Inbox is empty.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
