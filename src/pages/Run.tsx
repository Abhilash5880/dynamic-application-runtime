import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/forge/TopBar";
import { AppRunner } from "@/components/forge/AppRunner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/runtime/i18n";

const Run = () => {
  const { id } = useParams();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [config, setConfig] = useState<unknown>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("app_configs")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else if (!data) setError("App not found");
        else {
          setName(data.name);
          setConfig(data.config);
        }
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <TopBar />
      <main className="container py-6 max-w-6xl">
        <Link to="/apps">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> {t("nav.apps")}
          </Button>
        </Link>
        {loading ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6">{name}</h1>
            <AppRunner appId={id!} config={config} />
          </>
        )}
      </main>
    </div>
  );
};

export default Run;