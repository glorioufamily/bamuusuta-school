import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { Plus, Loader2, Bell, Trash2, Calendar, ExternalLink, FileText, Video, Image, Shield } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

type AnnouncementForm = {
  title: string;
  content: string;
  visibility: "public" | "staff" | "students" | "parents";
  category: "general" | "event" | "achievement" | "alert" | "academic";
  imageUrl: string;
  videoUrl: string;
  documentUrl: string;
  externalLink: string;
  eventDate: string;
};

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM dd, yyyy");
}

export function ClubDashboardPage() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: announcements, isLoading } = useListAnnouncements();
  const clubAnnouncements = announcements?.filter(a => a.authorId === user?.id) ?? [];

  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AnnouncementForm>({
    defaultValues: {
      title: "", content: "", visibility: "public", category: "general",
      imageUrl: "", videoUrl: "", documentUrl: "", externalLink: "", eventDate: "",
    },
  });

  const onSubmit = (data: AnnouncementForm) => {
    const payload: any = {
      title: data.title,
      content: data.content,
      visibility: data.visibility,
      category: data.category,
      imageUrl: data.imageUrl || null,
      videoUrl: data.videoUrl || null,
      documentUrl: data.documentUrl || null,
      externalLink: data.externalLink || null,
      eventDate: data.eventDate || null,
      pinned: false,
    };
    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        toast.success("Announcement posted!");
        setIsCreateOpen(false);
        reset();
        queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      },
      onError: () => toast.error("Failed to post announcement"),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Deleted");
        queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="bg-primary/10 text-primary">Club Account</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{user?.name}</h1>
          <p className="text-muted-foreground">Post announcements, events, and activities for your club.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Club Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input {...register("title", { required: "Title is required" })} placeholder="e.g. Debate Club Practice Session" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Details *</Label>
                <Textarea {...register("content", { required: "Details are required" })} rows={4} placeholder="Describe the activity or announcement..." />
                {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="achievement">Achievement</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1">
                  <Label>Visibility</Label>
                  <Controller name="visibility" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Event Date (optional)</Label>
                <Input {...register("eventDate")} type="date" />
              </div>
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">MEDIA & LINKS (optional)</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Image className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input {...register("imageUrl")} placeholder="Image URL (JPG, PNG, WEBP)" className="h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input {...register("videoUrl")} placeholder="Video URL (MP4, WEBM)" className="h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input {...register("documentUrl")} placeholder="Document URL (PDF, DOCX, XLSX)" className="h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input {...register("externalLink")} placeholder="External link" className="h-8 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); reset(); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Post Announcement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-primary">{clubAnnouncements.length}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{clubAnnouncements.filter(a => a.category === "event").length}</p>
            <p className="text-sm text-muted-foreground">Events Posted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{clubAnnouncements.filter(a => a.category === "achievement").length}</p>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-foreground">Our Posts</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : clubAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-foreground">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Click "New Announcement" to post your first club update.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clubAnnouncements.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs capitalize">{a.category}</Badge>
                        <span className="text-xs text-muted-foreground">{getDateLabel(a.createdAt)}</span>
                        {a.eventDate && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {format(new Date(a.eventDate), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {a.imageUrl && <Badge variant="outline" className="text-xs"><Image className="h-3 w-3 mr-1" />Image</Badge>}
                    {a.videoUrl && <Badge variant="outline" className="text-xs"><Video className="h-3 w-3 mr-1" />Video</Badge>}
                    {a.documentUrl && <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Document</Badge>}
                    {a.externalLink && <Badge variant="outline" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" />Link</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
