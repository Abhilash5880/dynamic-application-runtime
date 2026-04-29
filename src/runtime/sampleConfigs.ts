export const SAMPLE_CRM = {
  name: "Mini CRM",
  description: "Track contacts and deals in one place.",
  entities: [
    {
      name: "contacts",
      label: "Contacts",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email" },
        { name: "company", type: "text" },
        { name: "stage", type: "select", options: ["lead", "qualified", "customer"] },
        { name: "notes", type: "textarea" },
      ],
    },
    {
      name: "deals",
      label: "Deals",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "amount", type: "number" },
        { name: "close_date", type: "date" },
        { name: "won", type: "boolean" },
      ],
    },
  ],
  views: [
    {
      id: "overview",
      type: "dashboard",
      title: "Overview",
      metrics: [
        { label: "Total contacts", entity: "contacts", op: "count" },
        { label: "Total deals", entity: "deals", op: "count" },
        { label: "Pipeline value", entity: "deals", op: "sum", field: "amount" },
      ],
    },
    { id: "new_contact", type: "form", title: "Add contact", entity: "contacts" },
    { id: "contacts_table", type: "table", title: "Contacts", entity: "contacts" },
    { id: "new_deal", type: "form", title: "Add deal", entity: "deals" },
    { id: "deals_table", type: "table", title: "Deals", entity: "deals" },
  ],
};

export const SAMPLE_TASKS = {
  name: "Task Tracker",
  description: "A tiny project task list.",
  entities: [
    {
      name: "tasks",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "priority", type: "select", options: ["low", "medium", "high"] },
        { name: "due", type: "date" },
        { name: "done", type: "boolean" },
      ],
    },
  ],
};

export const SAMPLES = [
  { key: "crm", label: "Mini CRM", config: SAMPLE_CRM },
  { key: "tasks", label: "Task Tracker", config: SAMPLE_TASKS },
];