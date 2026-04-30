import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4">
        <Link to="/" className="text-lg font-semibold text-foreground">
          Dynamic Application Runtime
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {showSignOut && (
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> {t("nav.signout")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};