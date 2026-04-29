import { Link, useNavigate } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useI18n } from "@/runtime/i18n";

export const TopBar = ({ showSignOut = true }: { showSignOut?: boolean }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg">Forge</span>
        </Link>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          {showSignOut && (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> {t("nav.signout")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};