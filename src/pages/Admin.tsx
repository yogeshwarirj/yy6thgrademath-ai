import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Shield, Loader2 } from "lucide-react";

interface UserUsage {
  user_id: string;
  email: string;
  student_name: string;
  questions_generated: number;
  quizzes_taken: number;
  pdfs_downloaded: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  updated_at: string;
}

const ADMIN_EMAIL = "rj.yogeshwari@gmail.com";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      method: "GET",
    });
    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const resetUsage = async (userId: string, email: string) => {
    if (!confirm(`Reset all usage for ${email}? This will reactivate their account.`)) return;
    setResetting(userId);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "reset_usage", user_id: userId },
    });
    if (error) {
      toast.error("Failed to reset usage");
    } else {
      toast.success(`Usage reset for ${email}`);
      fetchUsers();
    }
    setResetting(null);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
            <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Accounts & Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Questions</TableHead>
                      <TableHead className="text-right">Quizzes</TableHead>
                      <TableHead className="text-right">PDFs</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.student_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell className="text-right">{u.questions_generated}</TableCell>
                        <TableCell className="text-right">{u.quizzes_taken}</TableCell>
                        <TableCell className="text-right">{u.pdfs_downloaded}</TableCell>
                        <TableCell className="text-right font-mono">${u.estimated_cost.toFixed(4)}</TableCell>
                        <TableCell className="text-right">
                          {u.estimated_cost >= 10 ? (
                            <span className="text-xs font-semibold text-destructive">Inactive</span>
                          ) : (
                            <span className="text-xs font-semibold text-primary">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={u.estimated_cost >= 10 ? "default" : "outline"}
                            onClick={() => resetUsage(u.user_id, u.email)}
                            disabled={resetting === u.user_id}
                          >
                            {resetting === u.user_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reset"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
