import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { School, ArrowRight, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(3, "Password is required"),
  role: z.string().min(1, "Role is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [demoExpanded, setDemoExpanded] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "admin",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data: { username: data.username, password: data.password } },
      {
        onSuccess: (result) => {
          toast.success("Login successful", { description: `Welcome back, ${result.user.name}` });
          login(result.token, result.user);
          setLocation("/dashboard");
        },
        onError: (error) => {
          toast.error("Login failed", { description: error.data?.error || "Invalid credentials" });
        },
      }
    );
  };

  const fillDemo = (username: string, role: string) => {
    form.setValue("username", username);
    form.setValue("password", `${username}123`);
    form.setValue("role", role);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-blue-900 p-4 font-sans">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <div className="mx-auto bg-primary text-primary-foreground h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <School className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">EduMaster 360</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              School Operating System
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login As</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="headteacher">Headteacher</SelectItem>
                          <SelectItem value="dos">Director of Studies</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="bursar">Bursar</SelectItem>
                          <SelectItem value="student">Student / Parent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-6 h-11 text-base font-medium shadow-md transition-all active:scale-[0.98]" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col px-8 pb-8 bg-muted/30 rounded-b-xl border-t border-border/50">
            <button 
              type="button"
              onClick={() => setDemoExpanded(!demoExpanded)}
              className="text-xs text-muted-foreground font-medium w-full text-center hover:text-primary transition-colors py-2"
            >
              {demoExpanded ? "Hide Demo Credentials" : "Show Demo Credentials"}
            </button>
            
            <motion.div 
              initial={false}
              animate={{ height: demoExpanded ? "auto" : 0, opacity: demoExpanded ? 1 : 0 }}
              className="overflow-hidden w-full"
            >
              <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                <button type="button" onClick={() => fillDemo("admin", "admin")} className="text-left p-2 rounded bg-background border hover:border-primary transition-colors">
                  <span className="font-bold block text-foreground">Admin</span> admin / admin123
                </button>
                <button type="button" onClick={() => fillDemo("headteacher", "headteacher")} className="text-left p-2 rounded bg-background border hover:border-primary transition-colors">
                  <span className="font-bold block text-foreground">Head</span> headteacher / head123
                </button>
                <button type="button" onClick={() => fillDemo("teacher1", "teacher")} className="text-left p-2 rounded bg-background border hover:border-primary transition-colors">
                  <span className="font-bold block text-foreground">Teacher</span> teacher1 / teacher123
                </button>
                <button type="button" onClick={() => fillDemo("bursar", "bursar")} className="text-left p-2 rounded bg-background border hover:border-primary transition-colors">
                  <span className="font-bold block text-foreground">Bursar</span> bursar / bursar123
                </button>
                <button type="button" onClick={() => fillDemo("student1", "student")} className="text-left p-2 rounded bg-background border hover:border-primary transition-colors col-span-2">
                  <span className="font-bold block text-foreground">Student</span> student1 / student123
                </button>
              </div>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
