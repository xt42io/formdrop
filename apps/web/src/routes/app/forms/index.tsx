import { MouseLeftClick01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import moment from "moment";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
export const Route = createFileRoute("/app/forms/")({
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

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await appClient.forms.create({ name });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.form;
    },
    onSuccess: () => {
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await appClient.forms.list();
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.forms;
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between py-2">
          <h2 className="text-lg font-semibold">Forms</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent hover:bg-accent/90 transition-colors text-white px-5 py-3 rounded-3xl font-semibold text-sm"
          >
            Create Form
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 border border-gray-200 rounded-3xl animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between py-2">
          <h2 className="text-lg font-semibold">Forms</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent hover:bg-accent/90 transition-colors text-white px-5 py-3 rounded-3xl font-semibold text-sm"
          >
            Create Form
          </button>
        </div>
        <div className="mt-4 p-5 border border-red-200 rounded-3xl bg-red-50">
          <p className="text-red-600 text-sm">
            Failed to load forms: {error.message}
          </p>
        </div>
      </div>
    );
  }

  const forms = data || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Forms</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-accent hover:bg-accent/90 transition-colors text-white px-5 py-3 rounded-3xl font-semibold text-sm"
        >
          Create Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="mt-4 p-12 border border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center bg-gray-50/50">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent">
            <HugeiconsIcon icon={MouseLeftClick01Icon} size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-500 max-w-md mb-8">
            Create your first form to start collecting submissions. It only
            takes a few seconds.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent hover:bg-accent/90 transition-colors text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <HugeiconsIcon icon={Add01Icon} size={20} />
            Create New Form
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {forms.map((form) => (
            <Link
              to="/app/forms/$id/submissions"
              params={{
                id: form.id,
              }}
              key={form.id}
              className="p-5 border border-gray-200 rounded-3xl flex justify-between items-center hover:border-accent/50 transition-colors"
            >
              <div className="">
                <h3 className="font-medium">{form.name}</h3>
                <div className="flex gap-x-2 items-center mt-1">
                  <p className="text-xs text-gray-600">{form.id}</p>
                  <p className="text-xs text-gray-600 bg-gray-200/70 px-2 py-1 rounded-lg">
                    {moment(form.createdAt).format("MMM DD, YYYY")}
                  </p>
                </div>
              </div>
              <div className="flex gap-x-2">
                <div className="flex items-center text-gray-500 bg-gray-200/70 px-3 py-1 rounded-lg font-medium gap-x-2">
                  <HugeiconsIcon
                    icon={MouseLeftClick01Icon}
                    size={14}
                    className="text-accent"
                  />
                  <span className="text-xs">
                    {form.submissionCount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Create New Form
                </h3>
                <form onSubmit={handleCreate}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Name
                    </label>
                    <input
                      type="text"
                      value={newFormName}
                      onChange={(e) => setNewFormName(e.target.value)}
                      placeholder="e.g. Contact Us"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      autoFocus
                    />
                  </div>

                  {createError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                      {createError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setCreateError(null);
                        setNewFormName("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || !newFormName.trim()}
                      className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Form"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
