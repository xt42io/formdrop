import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";

interface ProfileSettingsProps {
  session: any;
}

export function ProfileSettings({ session }: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(session?.user?.name || "");

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await authClient.updateUser({
        name,
      });
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
    <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Profile Information
      </h2>
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl font-medium">
            {session?.user?.name?.charAt(0).toUpperCase() ||
              session?.user?.email?.charAt(0).toUpperCase()}
          </div>
          {/* Avatar upload to be implemented */}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              defaultValue={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-3xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            variant="primary"
            size="lg"
            className="shadow-lg shadow-accent/20"
            onClick={() => updateProfileMutation.mutate()}
            isLoading={updateProfileMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
