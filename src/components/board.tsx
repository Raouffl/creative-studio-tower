"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ExternalLink,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
  Shield,
  UserCog,
} from "lucide-react";
import { refreshBoard, signOutAction } from "@/app/actions";
import type { Bucket, TaskWithRevisions } from "@/lib/types";
import {
  bucketOf,
  COLUMNS,
  elapsedInfo,
  initials,
} from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortKey = "oldest" | "revisions" | "name";
type SortDir = "asc" | "desc";

const COLUMN_ACCENT: Record<Bucket, string> = {
  progress: "text-progress",
  wait: "text-wait",
  done: "text-done",
};

export function Board({
  tasks,
  now,
}: {
  tasks: TaskWithRevisions[];
  now: number;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [isRefreshing, startRefresh] = useTransition();
  const [revisions, setRevisions] = useState<Record<string, number>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.revisions])),
  );
  const [assignee, setAssignee] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("oldest");
  const [dir, setDir] = useState<SortDir>("asc");

  const assignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.assignees.forEach((a) => set.add(a)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const columns = useMemo(() => {
    const filtered = tasks.filter(
      (t) => assignee === "all" || t.assignees.includes(assignee),
    );
    const factor = dir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      let cmp: number;
      if (sort === "revisions") {
        cmp = (revisions[a.id] ?? 0) - (revisions[b.id] ?? 0);
      } else if (sort === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        const ea = a.created ?? a.closed ?? 0;
        const eb = b.created ?? b.closed ?? 0;
        cmp = ea - eb; // ascending = oldest / longest first
      }
      return cmp * factor;
    });
    const cols: Record<Bucket, TaskWithRevisions[]> = {
      progress: [],
      wait: [],
      done: [],
    };
    sorted.forEach((t) => cols[bucketOf(t)].push(t));
    return cols;
  }, [tasks, assignee, sort, dir, revisions]);

  const totals = useMemo(() => {
    const done = tasks.filter((t) => bucketOf(t) === "done").length;
    const waiting = tasks.filter((t) => bucketOf(t) === "wait").length;
    const totalRevisions = Object.values(revisions).reduce((s, n) => s + n, 0);
    return { total: tasks.length, done, waiting, totalRevisions };
  }, [tasks, revisions]);

  async function bump(id: string, dir: 1 | -1) {
    const next = Math.max(0, (revisions[id] ?? 0) + dir);
    setRevisions((prev) => ({ ...prev, [id]: next }));
    try {
      await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, count: next }),
      });
    } catch {
      // Keep the optimistic value; a refresh will reconcile from the DB.
    }
  }

  function onRefresh() {
    startRefresh(async () => {
      await refreshBoard();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <Ticker {...totals} />

      <header className="flex flex-wrap items-end justify-between gap-4 px-8 pb-2 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Creative <span className="text-progress">Studio</span>
          </h1>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground">
            Creative Studio space → Projects list · {totals.total} tasks ·
            connected live to ClickUp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/users")}
            >
              <Shield className="size-3.5" />
              Admin
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/account")}
          >
            <UserCog className="size-3.5" />
            Account
          </Button>
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="flex flex-wrap gap-2.5 px-8 pt-4">
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="w-56" size="sm">
            <SelectValue placeholder="All assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-56" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Sort: age / elapsed</SelectItem>
            <SelectItem value="revisions">Sort: revisions</SelectItem>
            <SelectItem value="name">Sort: name</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
          aria-label={`Sort direction: ${dir === "asc" ? "ascending" : "descending"}`}
          title={dir === "asc" ? "Ascending" : "Descending"}
        >
          {dir === "asc" ? (
            <ArrowUpNarrowWide className="size-4" />
          ) : (
            <ArrowDownWideNarrow className="size-4" />
          )}
          {dir === "asc" ? "Asc" : "Desc"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 px-8 pb-14 pt-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section
            key={col.key}
            className="min-h-52 rounded-2xl border border-border bg-card p-4"
          >
            <h3
              className={cn(
                "mb-3.5 flex items-center justify-between border-b border-border pb-2.5 text-xs font-semibold uppercase tracking-wider",
                COLUMN_ACCENT[col.key],
              )}
            >
              {col.title}
              <span className="font-mono text-muted-foreground">
                {columns[col.key].length}
              </span>
            </h3>
            {columns[col.key].length === 0 ? (
              <p className="py-5 text-center text-xs text-muted-foreground">
                No tasks
              </p>
            ) : (
              columns[col.key].map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  revisions={revisions[t.id] ?? 0}
                  now={now}
                  onBump={bump}
                />
              ))
            )}
          </section>
        ))}
      </div>

      <Footnote />
    </div>
  );
}

function Ticker({
  total,
  done,
  waiting,
  totalRevisions,
}: {
  total: number;
  done: number;
  waiting: number;
  totalRevisions: number;
}) {
  const items = [
    ["TASKS", total],
    ["DONE", done],
    ["AWAITING PM", waiting],
    ["TOTAL REVISIONS", totalRevisions],
  ] as const;
  return (
    <div className="flex items-center gap-8 overflow-x-auto whitespace-nowrap border-b border-border bg-popover px-6 py-2.5 font-mono text-xs tracking-wide text-muted-foreground">
      {items.map(([label, value]) => (
        <div key={label}>
          {label} <b className="text-sm text-foreground">{value}</b>
        </div>
      ))}
    </div>
  );
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  "waiting for pm feedback": {
    label: "Awaiting PM",
    className: "bg-wait/15 text-wait",
  },
  "on hold": { label: "On hold", className: "bg-hold/15 text-hold" },
  "ahmed validation": {
    label: "Validation",
    className: "bg-progress/15 text-progress",
  },
};

function TaskCard({
  task,
  revisions,
  now,
  onBump,
}: {
  task: TaskWithRevisions;
  revisions: number;
  now: number;
  onBump: (id: string, dir: 1 | -1) => void;
}) {
  const info = elapsedInfo(task, now);
  const flagged = task.status.toLowerCase() === "waiting for pm feedback";
  const badge = STATUS_BADGE[task.status.toLowerCase()];

  return (
    <div
      className={cn(
        "mb-2.5 rounded-xl border border-border bg-popover px-3.5 py-3",
        flagged && "border-l-[3px] border-l-wait",
      )}
    >
      <a
        href={task.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start justify-between gap-2 text-[13px] font-semibold leading-snug hover:text-progress"
      >
        <span>{task.name}</span>
        <ExternalLink className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-muted-foreground">
        <div className="flex">
          {task.assignees.length ? (
            task.assignees.map((a, i) => (
              <span
                key={a}
                title={a}
                className={cn(
                  "flex size-[19px] items-center justify-center rounded-full border-2 border-popover bg-border text-[8.5px] font-bold text-foreground",
                  i > 0 && "-ml-1.5",
                )}
              >
                {initials(a)}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </div>
        <span
          className={cn(
            "font-mono whitespace-nowrap text-foreground",
            info.approximate && "italic text-muted-foreground",
          )}
        >
          {info.label}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div>
          {badge ? (
            <Badge
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                badge.className,
              )}
            >
              {badge.label}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-muted-foreground">revisions</span>
          <button
            onClick={() => onBump(task.id, -1)}
            aria-label="Decrease revisions"
            className="flex size-[18px] items-center justify-center rounded border border-border bg-background text-muted-foreground hover:border-progress hover:text-foreground"
          >
            <Minus className="size-3" />
          </button>
          <span
            className={cn(
              "min-w-3.5 text-center",
              revisions >= 5 && "font-bold text-warn",
              revisions >= 3 && revisions < 5 && "font-bold text-wait",
            )}
          >
            {revisions}
          </span>
          <button
            onClick={() => onBump(task.id, 1)}
            aria-label="Increase revisions"
            className="flex size-[18px] items-center justify-center rounded border border-border bg-background text-muted-foreground hover:border-progress hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Footnote() {
  return (
    <div className="max-w-3xl px-8 pb-10 text-[11.5px] leading-relaxed text-muted-foreground">
      <b className="text-foreground">About these numbers:</b> the current
      ClickUp plan doesn&apos;t expose the &ldquo;Time in Status&rdquo; feature,
      so the exact history of status changes isn&apos;t available through the
      API. For active tasks, the elapsed time runs from creation to today. For
      completed tasks, it runs from creation to close when the creation date is
      provided, otherwise the close date is shown. The{" "}
      <b className="text-foreground">&ldquo;revisions&rdquo;</b> counter is a
      manual, editable (+/−) counter saved server-side (Postgres via Prisma) —
      increment it each time a PM sends a task back.
    </div>
  );
}
