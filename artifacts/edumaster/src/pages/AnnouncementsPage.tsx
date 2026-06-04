import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Bell, Plus, Loader2, Trash2, Pin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be detailed"),
  visibility: z.enum(["public", "staff", "students", "parents"]),
  category: z.enum(["general", "event", "achievement", "alert", "academic"]),
  pinned: z.boolean().default(false),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export function AnnouncementsPage() {
  const { role } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: announcements, isLoading } = useListAnnouncements();
  
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const canEdit = ["admin", "headteacher", "dos"].includes(role || "");

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "", visibility: "public", category: "general", pinned: false },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Announcement broadcasted");
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      },
      onError: (err) => toast.error("Failed to broadcast", { description: err.data?.error })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Announcement deleted");
          queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">School Announcements</h1>
          <p className="text-muted-foreground">Stay updated with latest news and events.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Broadcast Announcement</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Science Fair 2025" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="event">Event</SelectItem>
                              <SelectItem value="achievement">Achievement</SelectItem>
                              <SelectItem value="alert">Alert</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="staff">Staff Only</SelectItem>
                              <SelectItem value="students">Students Only</SelectItem>
                              <SelectItem value="parents">Parents Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel>Message Content</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Broadcast
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse bg-muted h-32" />)}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map(ann => (
            <Card key={ann.id} className={`overflow-hidden border-l-4 ${ann.pinned ? 'border-l-accent bg-accent/5' : 'border-l-primary'} shadow-sm`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {ann.pinned && <Pin className="h-4 w-4 text-accent fill-accent" />}
                    <Badge variant="secondary" className="capitalize text-primary bg-primary/10">{ann.category}</Badge>
                    <Badge variant="outline" className="capitalize text-xs">{ann.visibility}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(ann.createdAt).toLocaleDateString()}</span>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{ann.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{ann.content}</p>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  Posted by {ann.authorName}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No announcements</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
