import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Frequency = "off" | "weekly" | "monthly";

const OPTIONS: Array<{ id: Frequency; label: string; hint: string }> = [
  {
    id: "weekly",
    label: "Weekly",
    hint: "Every Monday, covering the week just finished.",
  },
  {
    id: "monthly",
    label: "Monthly",
    hint: "On the 1st, covering the month just finished.",
  },
  { id: "off", label: "Off", hint: "No summary emails." },
];

/**
 * How often this account gets its summary email.
 *
 * Three choices rather than a switch: the pricing page sells both cadences,
 * and a switch would make monthly unreachable.
 */
export function ReportSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["report-frequency"],
    queryFn: async () => {
      const response = await fetch("/api/user/report-frequency");
      if (!response.ok) throw new Error("Could not load your report setting");
      return (await response.json()) as { frequency: Frequency };
    },
  });

  const update = useMutation({
    mutationFn: async (frequency: Frequency) => {
      const response = await fetch("/api/user/report-frequency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency }),
      });
      if (!response.ok) throw new Error("Could not save that");
      return (await response.json()) as { frequency: Frequency };
    },
    onSuccess: (result) => {
      // Written straight into the cache rather than refetched: the server has
      // just told us what it stored.
      queryClient.setQueryData(["report-frequency"], result);
      toast.success(
        result.frequency === "off"
          ? "Summary emails turned off"
          : `Summary emails set to ${result.frequency}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const current = data?.frequency ?? "weekly";

  return (
    <section className="rounded-panel border border-ink-200 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink-950">Summary emails</h2>
      <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-600">
        A digest of what your forms collected, with the busiest ones and how the
        period compares to the one before.
      </p>

      <fieldset
        className="mt-6 flex flex-col gap-2"
        disabled={isLoading || update.isPending}
      >
        <legend className="sr-only">How often to send summary emails</legend>

        {OPTIONS.map((option) => {
          const selected = current === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-accent-500 bg-accent-50/60"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <input
                type="radio"
                name="report-frequency"
                value={option.id}
                checked={selected}
                onChange={() => update.mutate(option.id)}
                className="mt-0.5 h-4 w-4 accent-accent-500"
              />
              <span>
                <span className="block text-sm font-medium text-ink-950">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[13px] text-ink-500">
                  {option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
