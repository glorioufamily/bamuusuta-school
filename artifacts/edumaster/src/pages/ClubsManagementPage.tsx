import { useState } from "react";
import { useListClubs, useCreateClub, useUpdateClub, useDeleteClub } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { Plus, Loader2, Users, Trash2, Edit, KeyRound, Shield } from "lucide-react";

type ClubForm = {
  name: string;
  logoUrl: string;
  patron: string;
  description: string;
  username: string;
  password: string;
};

export function ClubsManagementPage() {
  const { data: clubs, isLoading } = useListClubs();
  const createMutation = useCreateClub();
  const updateMutation = useUpdateClub();
  const deleteMutation = useDeleteClub();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<number | null>(null);

  const createForm = useForm<ClubForm>({
    defaultValues: { name: "", logoUrl: "", patron: "", description: "", username: "", password: "" },
  });

  const editForm = useForm<Omit<ClubForm, "username" | "password">>({
    defaultValues: { name: "", logoUrl: "", patron: "", description: "" },
  });

  const onCreateSubmit = (data: ClubForm) => {
    createMutation.mutate({ data: { ...data, logoUrl: data.logoUrl || null, patron: data.patron || null, description: data.description || null, username: data.username || null, password: data.password || null } as any }, {
      onSuccess: () => {
        toast.success(`${data.name} club created`);
        setIsCreateOpen(false);
        createForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      },
      onError: () => toast.error("Failed to create club"),
    });
  };

  const onEditSubmit = (data: Omit<ClubForm, "username" | "password">) => {
    if (!editingClub) return;
    updateMutation.mutate({ id: editingClub, data: { name: data.name, logoUrl: data.logoUrl || null, patron: data.patron || null, description: data.description || null } as any }, {
      onSuccess: () => {
        toast.success("Club updated");
        setEditingClub(null);
        queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      },
      onError: () => toast.error("Failed to update club"),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This will also remove the club's login account.`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success(`${name} deleted`);
        queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      },
    });
  };

  const startEdit = (club: any) => {
    editForm.reset({ name: club.name, logoUrl: club.logoUrl ?? "", patron: club.patron ?? "", description: club.description ?? "" });
    setEditingClub(club.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Clubs & Societies
          </h1>
          <p className="text-muted-foreground mt-1">Manage official school clubs. Each club can have its own login to post announcements.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Club</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Club Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 mt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Club Name *</Label>
                  <Input {...createForm.register("name", { required: true })} placeholder="e.g. Debate Club" />
                </div>
                <div className="space-y-1">
                  <Label>Patron / Teacher</Label>
                  <Input {...createForm.register("patron")} placeholder="Mr. John Smith" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Logo URL</Label>
                <Input {...createForm.register("logoUrl")} placeholder="https://example.com/logo.png" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea {...createForm.register("description")} rows={2} placeholder="What does this club do?" />
              </div>
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><KeyRound className="h-3 w-3" /> LOGIN CREDENTIALS (optional)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Username</Label>
                    <Input {...createForm.register("username")} placeholder="debateclub" />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input {...createForm.register("password")} type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Club
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : clubs && clubs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Card key={club.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 rounded-lg border border-border/50">
                    <AvatarImage src={club.logoUrl ?? undefined} className="object-contain" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-lg">
                      {club.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight line-clamp-1">{club.name}</CardTitle>
                    {club.patron && <CardDescription className="text-xs mt-0.5">Patron: {club.patron}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                {club.description && <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>}
                <div className="mt-3">
                  {club.userId ? (
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
                      <Shield className="h-3 w-3 mr-1" /> Login Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">No login yet</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(club)}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(club.id, club.name)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No clubs yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first club to get started.</p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Club</Button>
        </div>
      )}

      <Dialog open={editingClub !== null} onOpenChange={(o) => !o && setEditingClub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Club Name *</Label>
                <Input {...editForm.register("name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Patron / Teacher</Label>
                <Input {...editForm.register("patron")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input {...editForm.register("logoUrl")} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea {...editForm.register("description")} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingClub(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
