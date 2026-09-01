import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  InformationCircleIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import { CopyButton } from "@/components/copy-button";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/button";

export const Route = createFileRoute("/app/api-keys")({
  head: () => ({
    meta: [{ title: "API Keys | FormDrop" }],
  }),
  component: ApiKeysPage,
});

interface ApiKey {
  id: string;
  key: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-gray-200 p-6 h-40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">
            Manage your API keys for backend access.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
        >
          Create New Key
        </Button>
      </div>

      <div className="grid gap-6">
        {keys.map((key) => (
          <motion.div
            key={key.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {key.name || "API Key"}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                    {key.key.substring(0, 8)}...
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeletingKeyId(key.id)}
                icon={<HugeiconsIcon icon={Delete02Icon} size={16} />}
              >
                Revoke
              </Button>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <code className="flex-1 font-mono text-sm text-gray-700 break-all blur-sm hover:blur-none transition-all duration-300">
                {key.key}
              </code>
              <CopyButton text={key.key} className="" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <HugeiconsIcon icon={InformationCircleIcon} size={14} />
              <span>Created {moment(key.createdAt).fromNow()}</span>
              {key.lastUsedAt && (
                <>
                  <span>•</span>
                  <span>Last used {moment(key.lastUsedAt).fromNow()}</span>
                </>
              )}
            </div>
          </motion.div>
        ))}

        {keys.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500">No API keys found.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setIsCreating(true)}
            >
              Create your first key
            </Button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-4 flex gap-3">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          size={20}
          className="text-blue-600 shrink-0 mt-0.5"
        />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Security Note</p>
          <p className="mt-1 text-blue-700">
            These keys grant full access to your account's forms and
            submissions. Keep them secure and never expose them in client-side
            code.
          </p>
        </div>
      </div>

      {/* Create Key Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <form onSubmit={handleCreate} className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Create New API Key
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production Server"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingKeyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingKeyId(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      className="text-red-600"
                      size={24}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Revoke API Key?
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to revoke this API key? Any applications
                  using it will immediately lose access. This action cannot be
                  undone.
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
                    onClick={() => deleteMutation.mutate(deletingKeyId)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending
                      ? "Revoking..."
                      : "Yes, Revoke Key"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
