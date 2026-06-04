import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Redirect } from "wouter";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();
  
  const [role, setRole] = useState("headteacher");
  const [username, setUsername] = useState("headteacher");
  const [password, setPassword] = useState("password");

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  const handleRoleChange = (val: string) => {
    setRole(val);
    setUsername(val);
    setPassword("password");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({ title: "Welcome back", description: "Successfully logged in." });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: err.error || "Invalid credentials",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl bg-background/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">EduMaster 360</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">System Admin</SelectItem>
                  <SelectItem value="headteacher">Headteacher</SelectItem>
                  <SelectItem value="dos">Director of Studies</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="bursar">Bursar</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center border-t border-border/50 pt-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Demo Credentials: Use role name as username (e.g., "headteacher") and "password" as password.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
