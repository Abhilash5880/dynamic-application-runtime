import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LayoutDashboard, Plus, Table } from "lucide-react";
import { normalizeConfig } from "@/runtime/normalize";
import { FormView } from "./FormView";
import { TableView } from "./TableView";
import { DashboardView } from "./DashboardView";
import { useI18n } from "@/runtime/i18n";

const iconFor = (type: string) => {
  if (type === "form") return <Plus className="h-3.5 w-3.5" />;
  if (type === "dashboard") return <LayoutDashboard className="h-3.5 w-3.5" />;
  return <Table className="h-3.5 w-3.5" />;
};

export const AppRunner = ({ appId, config }: { appId: string; config: unknown }) => {
  const { t } = useI18n();
  const norm = useMemo(() => normalizeConfig(config), [config]);
  const [refreshKey, setRefreshKey] = useState(0);

  if (norm.entities.length === 0 && norm.views.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Empty configuration</AlertTitle>
        <AlertDescription>This app has no entities or views defined.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {norm.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("run.warnings")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 text-sm space-y-0.5">
              {norm.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={norm.views[0]?.id} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-secondary/60">
          {norm.views.map((v) => (
            <TabsTrigger key={v.id} value={v.id} className="gap-1.5 text-xs sm:text-sm">
              {iconFor(v.type)}
              {v.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {norm.views.map((v) => {
          const entity = v.entity ? norm.entities.find((e) => e.name === v.entity) : undefined;
          return (
            <TabsContent key={v.id} value={v.id} className="mt-4">
              {v.type === "dashboard" ? (
                <DashboardView appId={appId} view={v} entities={norm.entities} refreshKey={refreshKey} />
              ) : v.type === "form" ? (
                entity ? (
                  <FormView
                    appId={appId}
                    view={v}
                    entity={entity}
                    onCreated={() => setRefreshKey((n) => n + 1)}
                  />
                ) : <MissingEntity name={v.entity} />
              ) : v.type === "table" ? (
                entity ? (
                  <TableView appId={appId} view={v} entity={entity} refreshKey={refreshKey} />
                ) : <MissingEntity name={v.entity} />
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unsupported view type "{v.type}"</AlertTitle>
                </Alert>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

const MissingEntity = ({ name }: { name?: string }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Missing entity</AlertTitle>
    <AlertDescription>
      This view references entity "{name ?? "?"}" which is not defined in the config.
    </AlertDescription>
  </Alert>
);