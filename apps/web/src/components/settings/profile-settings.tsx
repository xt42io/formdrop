import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@formdrop/ui";

interface ProfileSettingsProps {
  session: any;
}

export function ProfileSettings({ session }: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const savedName: string = session?.user?.name || "";
  const email: string = session?.user?.email || "";
  const [name, setName] = useState(savedName);

  useEffect(() => {
    if (savedName) {
      setName(savedName);
    }
  }, [savedName]);

  const trimmed = name.trim();
  // Save used to be permanently enabled, so the obvious thing to do on this
  // screen -- open it, look at it, press the only button -- sent a write that
  // changed nothing and reported success. It now only lights up when there is
  // an actual edit to save.
  const isDirty = trimmed.length > 0 && trimmed !== savedName;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await authClient.updateUser({ name: trimmed });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  return (
    <div className="overflow-hidden rounded-panel border border-ink-200 bg-white">
      {/* The avatar used to sit alone in an empty flex row next to a comment
          promising an upload that does not exist, which read as a broken
          control. Paired with the name and address it is what it actually is:
          a summary of the account you are editing. */}
      <div className="flex items-center gap-4 border-b border-ink-100 bg-ink-50 px-6 py-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xl font-semibold text-white">
          {(savedName || email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
            {savedName || "Unnamed account"}
          </div>
          <div className="truncate text-sm text-ink-500">{email}</div>
        </div>
      </div>

      <form
        className="px-6 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (isDirty) updateProfileMutation.mutate();
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-ink-700"
            >
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm text-ink-950 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-ink-700"
            >
              Email address
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-500"
            />
            {/* A greyed-out field with no explanation reads as a bug. */}
            <p className="mt-2 text-xs text-ink-500">
              Your email identifies the account and cannot be changed here.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink-100 pt-5">
          {isDirty && (
            <span className="text-xs text-ink-500">Unsaved changes</span>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty}
            isLoading={updateProfileMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
