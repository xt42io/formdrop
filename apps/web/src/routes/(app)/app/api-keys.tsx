import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient, type ApiKey } from "@/lib/app-client";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AlertCircleIcon,
  Delete02Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import { CopyButton } from "@/components/copy-button";
import { Button, Modal } from "@formdrop/ui";

export const Route = createFileRoute("/(app)/app/api-keys")({
  head: () => ({
    meta: [{ title: "API Keys | FormDrop" }],
  }),
  component: ApiKeysPage,
});

// Derived in app-client from the query that produces it. This local copy was
// the only one of the four duplicates that had its timestamps right.

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await appClient.apiKeys.list();
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.keys as unknown as ApiKey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await appClient.apiKeys.create({ name });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setIsCreating(false);
      setNewKeyName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await appClient.apiKeys.delete({ id });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setDeletingKeyId(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createMutation.mutate(newKeyName);
  };

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-ink-100" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-ink-100" />
        <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between border-b border-ink-100 px-6 py-5 last:border-b-0"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-56 animate-pulse rounded bg-ink-100" />
              </div>
              <div className="h-7 w-40 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            API keys
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Read your forms and submissions from your own backend.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
        >
          Create key
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
          <div className="px-8 py-12 text-center">
            <h3 className="text-lg font-semibold text-ink-950">No keys yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
              You only need one if you are reading submissions from your own
              code. Collecting them needs no key at all -- a form posts to its
              endpoint directly.
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="mt-6"
              icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
            >
              Create your first key
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-enter-late mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
          <div className="divide-y divide-ink-100">
            {keys.map((key) => (
              <ApiKeyRow
                key={key.id}
                apiKey={key}
                onRevoke={() => setDeletingKeyId(key.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-panel border border-tint-amber bg-tint-amber/40 p-4">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          size={18}
          className="mt-0.5 shrink-0 text-tint-amber-ink"
        />
        <p className="text-sm leading-relaxed text-tint-amber-ink">
          A key grants full access to every form and submission on this account.
          Keep it on a server -- anything shipped to a browser is public,
          however it is bundled.
        </p>
      </div>

      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        label="Create New API Key"
      >
        <form onSubmit={handleCreate} className="p-6">
          <h3 className="text-xl font-bold text-ink-950 mb-4">
            Create New API Key
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Server"
                className="w-full px-3 py-2 border border-ink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newKeyName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingKeyId !== null}
        onClose={() => setDeletingKeyId(null)}
        label="Revoke API Key?"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-tint-rose rounded-full">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="text-tint-rose-ink"
                size={24}
              />
            </div>
            <h3 className="text-xl font-bold text-ink-950">Revoke API Key?</h3>
          </div>
          <p className="text-ink-600 mb-6">
            Are you sure you want to revoke this API key? Any applications using
            it will immediately lose access. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingKeyId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deletingKeyId && deleteMutation.mutate(deletingKeyId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Revoking..." : "Yes, Revoke Key"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * One key.
 *
 * The secret is behind a button, not a CSS blur. The previous row rendered the
 * whole key with `blur-sm hover:blur-none`, which is not a control at all: the
 * value sits in the DOM and in the page source, and a stray hover reveals it
 * during a screen-share. Revealing is now deliberate and times out.
 *
 * This is also the shape the PRD is heading for. W2 stores a SHA-256 and keeps
 * a display prefix, after which the plaintext genuinely cannot be shown again
 * -- at that point Reveal simply stops being rendered and the rest of this row
 * is already correct.
 */
function ApiKeyRow({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKey;
  onRevoke: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(false), 15_000);
    return () => clearTimeout(timer);
  }, [revealed]);

  // Stacked below sm. The key pill is shrink-0 by necessity -- a truncated
  // secret is useless -- so on one line it took its ~150px out of the name,
  // which is the field that identifies the key: "Production server" came out
  // as "Production s..." and "Staging" as "S...".
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 sm:px-6">
      <div className="min-w-0 sm:flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-ink-950">
            {apiKey.name || "Untitled key"}
          </span>
          {!apiKey.lastUsedAt && (
            <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
              Never used
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-ink-500">
          Created {moment(apiKey.createdAt).fromNow()}
          {apiKey.lastUsedAt && (
            <> &middot; last used {moment(apiKey.lastUsedAt).fromNow()}</>
          )}
        </div>
      </div>

      <code className="w-fit max-w-full shrink-0 rounded-lg bg-ink-50 px-2.5 py-1.5 font-mono text-xs break-all text-ink-700">
        {revealed ? apiKey.key : `${apiKey.key.slice(0, 12)}${"•".repeat(8)}`}
      </code>

      <div className="-ml-2 flex shrink-0 items-center gap-1 sm:ml-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          icon={
            <HugeiconsIcon icon={revealed ? ViewOffIcon : ViewIcon} size={15} />
          }
        >
          {revealed ? "Hide" : "Reveal"}
        </Button>
        <CopyButton text={apiKey.key} className="relative" />
        <Button
          variant="ghost"
          size="sm"
          className="text-tint-rose-ink hover:bg-tint-rose"
          onClick={onRevoke}
          icon={<HugeiconsIcon icon={Delete02Icon} size={15} />}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
}
