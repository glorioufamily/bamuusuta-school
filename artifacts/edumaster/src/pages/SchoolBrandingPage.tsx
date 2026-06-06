import { useGetSchoolBranding, useUpdateSchoolBranding } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { Loader2, School, Globe, Mail, MapPin, Phone, Palette } from "lucide-react";

type BrandingForm = {
  schoolName: string;
  motto: string;
  logoUrl: string;
  contactInfo: string;
  address: string;
  email: string;
  website: string;
  welcomeMessage: string;
};

export function SchoolBrandingPage() {
  const { data: branding, isLoading } = useGetSchoolBranding();
  const updateMutation = useUpdateSchoolBranding();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<BrandingForm>({
    defaultValues: {
      schoolName: "", motto: "", logoUrl: "", contactInfo: "",
      address: "", email: "", website: "", welcomeMessage: "",
    },
  });

  useEffect(() => {
    if (branding) {
      reset({
        schoolName: branding.schoolName ?? "",
        motto: branding.motto ?? "",
        logoUrl: branding.logoUrl ?? "",
        contactInfo: branding.contactInfo ?? "",
        address: branding.address ?? "",
        email: branding.email ?? "",
        website: branding.website ?? "",
        welcomeMessage: branding.welcomeMessage ?? "",
      });
    }
  }, [branding, reset]);

  const onSubmit = (data: BrandingForm) => {
    const payload: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(data)) {
      payload[k] = v === "" ? null : v;
    }
    updateMutation.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast.success("School branding updated");
        queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      },
      onError: () => toast.error("Failed to update branding"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Palette className="h-7 w-7 text-primary" />
          School Branding
        </h1>
        <p className="text-muted-foreground mt-1">Manage your school's identity — these settings appear across the entire system and public landing page.</p>
      </div>

      {branding?.logoUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-4">
            <img src={branding.logoUrl} alt="School Logo" className="h-20 w-20 rounded-lg object-contain bg-white border border-border" />
            <div>
              <p className="font-bold text-lg text-foreground">{branding.schoolName}</p>
              {branding.motto && <p className="text-muted-foreground italic text-sm">"{branding.motto}"</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><School className="h-4 w-4" /> Identity</CardTitle>
            <CardDescription>Core school information shown on the landing page header.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input {...register("schoolName")} placeholder="e.g. Greenfield Academy" />
              </div>
              <div className="space-y-2">
                <Label>School Motto</Label>
                <Input {...register("motto")} placeholder="e.g. Excellence in all we do" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>School Logo URL</Label>
              <Input {...register("logoUrl")} placeholder="https://example.com/logo.png" />
              <p className="text-xs text-muted-foreground">Paste a public image URL for the school logo. Shown in the header and landing page.</p>
            </div>
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea {...register("welcomeMessage")} rows={3} placeholder="A warm welcome message for visitors to the landing page..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Contact Information</CardTitle>
            <CardDescription>Shown in the footer and contact section of the landing page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Textarea {...register("address")} rows={2} placeholder="123 School Road, City, Region" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Contact / Phone</Label>
                <Input {...register("contactInfo")} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <Input {...register("email")} type="email" placeholder="info@school.edu" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
              <Input {...register("website")} placeholder="https://www.school.edu" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateMutation.isPending} className="min-w-[140px]">
            {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Branding"}
          </Button>
          {isDirty && (
            <Button type="button" variant="outline" onClick={() => reset()}>Discard Changes</Button>
          )}
        </div>
      </form>
    </div>
  );
}
