import type { ClickUpError } from "@/lib/clickup";

const MESSAGES: Record<ClickUpError["kind"], { title: string; hint: string }> = {
  config: {
    title: "ClickUp integration not configured",
    hint: "Set CLICKUP_TOKEN and CLICKUP_LIST_ID in your .env file, then restart the server.",
  },
  auth: {
    title: "ClickUp token rejected",
    hint: "The API token is invalid or expired. Regenerate it in ClickUp → Settings → Apps → API Token.",
  },
  http: {
    title: "ClickUp API error",
    hint: "ClickUp returned an error. Check the list ID and try again in a moment.",
  },
};

export function SetupNotice({
  kind,
  detail,
}: {
  kind: ClickUpError["kind"];
  detail: string;
}) {
  const { title, hint } = MESSAGES[kind];
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-wait">
          Setup required
        </div>
        <h1 className="mb-3 text-xl font-bold">{title}</h1>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{hint}</p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
          {detail}
        </pre>
      </div>
    </main>
  );
}
