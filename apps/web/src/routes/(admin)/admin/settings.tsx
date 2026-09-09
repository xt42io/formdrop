import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Icon, Modal } from "@formdrop/ui";
import { AlertCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import moment from "moment";
import { adminClient } from "@/lib/admin-client";
import { Pill } from "@/components/admin/pill";

/**
 * Platform maintenance (PRD 4.6).
 *
 * 4.6 asks this screen to keep its maintenance actions, "each behind an
 * explicit confirm that names what will be deleted and how many rows". The
 * count is the substance of this rewrite: the delete underneath is a hard one,
 * so an operator who guesses wrong does not get the rows back, and the prompt
 * it replaces could only offer "submissions older than 90 days".
 */
export const Route = createFileRoute("/(admin)/admin/settings")({
  component: AdminSettings,
});

/** A labelled fact. Only used for things that are actually true. */
function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-ink-200 p-4">
      <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">
        {label}
      </p>
      <div className="mt-1.5 text-[15px] font-semibold text-ink-950">
        {children}
      </div>
    </div>
  );
}

function AdminSettings() {
  const [confirming, setConfirming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<
    { ok: true; deleted: number } | { ok: false; message: string } | null
  >(null);

  // The number the confirmation needs, and the thing that tells the operator
  // whether there is anything to do at all.
  const {
    data: retention,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "old-submissions"],
    queryFn: async () => {
      const response = await adminClient.oldSubmissions();
      if ("error" in response) throw new Error(response.error);
      return response;
    },
  });

  const clear = async () => {
    setIsClearing(true);
    setResult(null);
    try {
      const response = await adminClient.clearOldSubmissions();
      if ("error" in response) {
        setResult({ ok: false, message: response.error });
        return;
      }
      setResult({ ok: true, deleted: response.deletedCount });
      setConfirming(false);
      await refetch();
    } catch {
      setResult({ ok: false, message: "Failed to clear old submissions." });
    } finally {
      setIsClearing(false);
    }
  };

  const count = retention?.count ?? 0;
  const days = retention?.retentionDays ?? 90;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Maintenance actions that affect every account.
        </p>
      </div>

      <section className="animate-enter-late mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-6 py-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
            Retention
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Submissions older than {days} days can be removed to reclaim space.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            {isLoading ? (
              <div className="h-6 w-48 animate-pulse rounded bg-ink-100" />
            ) : (
              <>
                <p className="text-[15px] text-ink-950">
                  <span className="font-semibold tabular-nums">
                    {count.toLocaleString()}
                  </span>{" "}
                  submission{count === 1 ? "" : "s"} older than{" "}
                  {retention
                    ? moment(retention.cutoff).format("MMM D, YYYY")
                    : `${days} days`}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {count === 0
                    ? "Nothing to remove."
                    : "Removing these is permanent — they are not soft-deleted."}
                </p>
              </>
            )}
          </div>

          <Button
            variant="danger"
            onClick={() => setConfirming(true)}
            // Nothing to delete is not a state worth offering a button for.
            disabled={isLoading || count === 0}
          >
            Remove {count > 0 ? count.toLocaleString() : ""} submission
            {count === 1 ? "" : "s"}
          </Button>
        </div>

        {result && (
          <div
            className={`flex items-start gap-3 border-t px-6 py-4 text-sm ${
              result.ok
                ? "border-tint-green bg-tint-green/30 text-tint-green-ink"
                : "border-tint-rose bg-tint-rose/30 text-tint-rose-ink"
            }`}
          >
            {/* Driven by a flag, not by sniffing the message for the word
                "Successfully" -- which is what decided the colour before, and
                would have shown an error in green the moment the copy
                changed. */}
            <Icon
              icon={result.ok ? Tick02Icon : AlertCircleIcon}
              size={16}
              className="mt-0.5 shrink-0"
            />
            <p>
              {result.ok
                ? `Removed ${result.deleted.toLocaleString()} submission${result.deleted === 1 ? "" : "s"}.`
                : result.message}
            </p>
          </div>
        )}
      </section>

      <section className="animate-enter-late mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-6 py-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
            Environment
          </h2>
        </div>
        {/*
          Every value here is read from something real.

          What this replaces listed "Database Status: Connected" as a literal
          string, so it said Connected during an outage -- on the one panel an
          operator would check to find out. It also carried a hardcoded version
          and a "Last Backup: N/A" for a backup system that does not exist.
          Facts that cannot be sourced are not shown rather than invented.
        */}
        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
          <Fact label="Mode">{import.meta.env.MODE}</Fact>
          <Fact label="Database">
            {isLoading ? (
              <span className="text-ink-400">Checking…</span>
            ) : retention ? (
              <Pill tone="good">Reachable</Pill>
            ) : (
              <Pill tone="bad">Not reachable</Pill>
            )}
          </Fact>
        </div>
      </section>

      <section className="animate-enter-late mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-6 py-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
            Not available yet
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-ink-950">
              Maintenance mode
            </p>
            <p className="mt-1 text-sm text-ink-600">
              Close the app to everyone but admins while work is in progress.
            </p>
          </div>
          <Pill tone="neutral">Coming soon</Pill>
        </div>
      </section>

      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        label="Remove old submissions?"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ink-950">
            Remove {count.toLocaleString()} submission
            {count === 1 ? "" : "s"}?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Everything received before{" "}
            <span className="font-medium text-ink-950">
              {retention
                ? moment(retention.cutoff).format("MMMM D, YYYY")
                : `${days} days ago`}
            </span>{" "}
            will be deleted outright, across every account. Unlike deleting a
            form, this is not reversible and the rows do not stay recoverable.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={clear} isLoading={isClearing}>
              Remove permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
