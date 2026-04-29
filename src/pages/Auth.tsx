import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/runtime/i18n";
import { LocaleSwitcher } from "@/components/forge/LocaleSwitcher";
import { toast } from "sonner";

const Auth = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/apps", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/apps` },
        });
        if (error) throw error;
        toast.success("Account created — signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/apps", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col">
      <div className="container flex justify-between items-center py-4">
        <div className="flex items-center gap-2 font-bold">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </span>
          Forge
        </div>
        <LocaleSwitcher />
      </div>
      <main className="flex-1 grid place-items-center px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-elegant border-border/60 backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-1">
              {mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{t("app.tagline")}</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-primary hover:opacity-90 transition-opacity gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? t("auth.signin") : t("auth.signup")}
              </Button>
            </form>
            <button
              type="button"
              className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            >
              {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
            </button>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;