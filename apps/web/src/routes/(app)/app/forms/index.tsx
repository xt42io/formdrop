import { Add01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capture } from "@formdrop/analytics";
import { useForms } from "@/hooks/use-forms";
import { appClient } from "@/lib/app-client";
import { useState } from "react";
import { Button, Icon, Modal } from "@formdrop/ui";
import { FormsTable } from "@/components/forms-table";
import { FormsEmptyState } from "@/components/forms-empty-state";
import { StatStrip } from "@/components/stat-strip";
export const Route = createFileRoute("/(app)/app/forms/")({
  head: () => ({
    meta: [{ title: "Forms | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
    setNewFormName("");
  };

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await appClient.forms.create({ name });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.form;
    },
    onSuccess: () => {
      capture("form_created");
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setIsCreateModalOpen(false);
      setNewFormName("");
      setCreateError(null);
    },
    onError: (error) => {
      setCreateError(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;
    createMutation.mutate(newFormName);
  };

  const { data, isLoading, error } = useForms();

  const forms = data ?? [];

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Forms
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Every endpoint collecting submissions for you.
        </p>
      </div>
      <Button
        onClick={() => setIsCreateModalOpen(true)}
        icon={<Icon icon={Add01Icon} size={16} />}
      >
        Create Form
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between border-b border-ink-100 px-5 py-5 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        <div className="mt-6 rounded-panel border border-tint-rose bg-tint-rose/40 p-5">
          <p className="text-sm text-tint-rose-ink">
            Failed to load forms: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      {forms.length === 0 ? (
        <FormsEmptyState onCreate={() => setIsCreateModalOpen(true)} />
      ) : (
        <>
          {/* Computed from the rows already on the page -- no extra request
              to show the numbers that summarise them. */}
          <StatStrip
            stats={[
              {
                label: "Submissions",
                value: forms.reduce((n, f) => n + (f.submissionCount ?? 0), 0),
                detail: `across ${forms.length} form${forms.length === 1 ? "" : "s"}`,
                feature: true,
              },
              {
                label: "Last 7 days",
                value: forms.reduce(
                  (n, f) =>
                    n + (f.recentUsage ?? []).reduce((d, u) => d + u.count, 0),
                  0,
                ),
                detail: "across every form",
              },
              {
                label: "Collecting",
                value: forms.filter((f) => (f.submissionCount ?? 0) > 0).length,
                detail: `of ${forms.length} have submissions`,
              },
            ]}
          />
          <FormsTable forms={forms} />
        </>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        label="Create New Form"
      >
        <div className="p-6">
          <h3 className="mb-1 text-lg font-semibold text-ink-950">
            Create New Form
          </h3>
          <p className="mb-5 text-sm text-ink-600">
            You can rename it later; the endpoint URL will not change.
          </p>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Form Name
              </label>
              <input
                type="text"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="e.g. Contact Us"
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-950 transition-colors placeholder:text-ink-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none"
                autoFocus
              />
            </div>

            {createError && (
              <div className="mb-4 rounded-xl bg-tint-rose px-3 py-2.5 text-sm text-tint-rose-ink">
                {createError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !newFormName.trim()}
                isLoading={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
