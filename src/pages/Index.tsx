import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Database, Layers, Zap, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/forge/LocaleSwitcher";
import { useI18n } from "@/runtime/i18n";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Layers, title: "Dynamic UI", body: "Forms, tables and dashboards rendered straight from JSON — no templates." },
  { icon: Database, title: "Generic CRUD", body: "Every entity gets a schema-flexible store with row-level security baked in." },
  { icon: Zap, title: "Resilient", body: "Missing fields, unknown types, broken views — the runtime degrades gracefully." },
  { icon: Globe, title: "Multi-language", body: "Switch UI between English, Español, Français and हिन्दी on the fly." },
  { icon: Lock, title: "User-scoped", body: "Each user only ever sees their own apps and data — enforced at the database." },
  { icon: Sparkles, title: "CSV import", body: "Upload a CSV, map columns, and bulk-load any entity in seconds." },
];

const SAMPLE = `{
  "name": "Mini CRM",
  "entities": [{
    "name": "contacts",
    "fields": [
      { "name": "name", "required": true },
      { "name": "email", "type": "email" },
      { "name": "stage", "type": "select",
        "options": ["lead", "qualified", "customer"] }
    ]
  }],
  "views": [
    { "type": "form",  "entity": "contacts", "title": "Add contact" },
    { "type": "table", "entity": "contacts", "title": "Contacts" }
  ]
}`;

const Index = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // optional: don't auto-redirect — let visitors see the landing page
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </span>
          Forge
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Link to="/auth">
            <Button variant="ghost" size="sm">{t("auth.signin")}</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container pt-12 pb-20 text-center max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight"
          >
            Ship apps from <span className="text-gradient">JSON</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto"
          >
            Forge is a tiny app generator. Describe entities and views in JSON,
            and it renders a working frontend, backend and database — secured per user.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2">
                Try it free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        <section className="container pb-20 grid lg:grid-cols-2 gap-8 items-center">
          <Card className="p-6 shadow-elegant border-border/60 overflow-hidden">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">config.json</div>
            <pre className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap text-foreground/90">
              <code>{SAMPLE}</code>
            </pre>
          </Card>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">One JSON in.<br/>A live app out.</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              No code generation, no scaffolding, no rebuilds. The runtime reads your
              configuration on every render — so changes go live instantly.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["forms", "tables", "dashboards", "metrics", "csv import", "i18n"].map((b) => (
                <span key={b} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">{b}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="p-6 shadow-card h-full">
                  <div className="grid place-items-center h-10 w-10 rounded-lg bg-gradient-primary text-primary-foreground mb-4">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">{f.body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      
    </div>
  );
};

export default Index;
