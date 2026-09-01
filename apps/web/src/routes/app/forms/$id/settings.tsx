import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import {
  ArrowLeft01Icon,
  Tick02Icon,
  Delete02Icon,
  AlertCircleIcon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/button";

export const Route = createFileRoute("/app/forms/$id/settings")({
  head: () => ({
    meta: [{ title: "Settings | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const response = await appClient.forms.get(id);
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.form;
    },
  });

  useEffect(() => {
    if (form) {
      setName(form.name);
      setDescription(form.description || "");
      setAllowedDomains(form.allowedDomains || []);
    }
  }, [form]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      allowedDomains: string[];
    }) => {
      const response = await appClient.forms.update(id, data);
      if ("error" in response) throw new Error(response.error);
      return response.form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", id] });
      // Maybe show a toast?
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await appClient.forms.delete(id);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate({ to: "/app/forms" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ name, description, allowedDomains });
  };

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      const domain = newDomain.trim();
      // Prevent duplicates
      if (!allowedDomains.includes(domain)) {
        const newDomains = [...allowedDomains, domain];
        setAllowedDomains(newDomains);
        updateMutation.mutate({
          name,
          description,
          allowedDomains: newDomains,
        });
      }
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const newDomains = allowedDomains.filter(
      (domain) => domain !== domainToRemove,
    );
    setAllowedDomains(newDomains);
    updateMutation.mutate({ name, description, allowedDomains: newDomains });
  };

  const handleDelete = () => {
    if (deleteConfirmationText === form?.name) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 w-full bg-gray-200 rounded"></div>
          <div className="h-32 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!form) return <div>Form not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-x-3 py-2 mb-6">
        <Link
          to="/app/forms"
          className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </Link>
        <h2 className="text-lg font-semibold">Form Settings</h2>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">General Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="My Awesome Form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="What is this form for?"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                isLoading={updateMutation.isPending}
                variant="primary"
                size="md"
                className="rounded-3xl"
                icon={
                  !updateMutation.isPending && (
                    <HugeiconsIcon icon={Tick02Icon} size={18} />
                  )
                }
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Allowed Domains */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">Allowed Domains</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Restrict which websites can submit to this form. Leave empty to
              allow all domains.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                className="flex-1 px-3 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="example.com"
              />
              <Button
                onClick={handleAddDomain}
                disabled={!newDomain.trim()}
                variant="secondary"
                size="lg"
                className="rounded-3xl bg-gray-100 border-transparent"
                icon={<HugeiconsIcon icon={Add01Icon} size={20} />}
              />
            </div>

            {allowedDomains.length > 0 ? (
              <div className="space-y-2">
                {allowedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {domain}
                    </span>
                    <Button
                      onClick={() => handleRemoveDomain(domain)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-500 p-1 h-auto"
                      icon={<HugeiconsIcon icon={Cancel01Icon} size={16} />}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  No domains restricted. All domains are allowed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-6">
            Once you delete a form, there is no going back. Please be certain.
          </p>

          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="danger"
            size="md"
            icon={<HugeiconsIcon icon={Delete02Icon} size={18} />}
          >
            Delete Form
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-x-3 mb-4 text-red-600">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <HugeiconsIcon icon={AlertCircleIcon} size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Form?
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. This will permanently delete the
                  form <strong>{form.name}</strong> and all of its submissions.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <strong>{form.name}</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="flex gap-x-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="secondary"
                    size="md"
                    className="rounded-3xl bg-transparent border-transparent hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={
                      deleteConfirmationText !== form.name ||
                      deleteMutation.isPending
                    }
                    isLoading={deleteMutation.isPending}
                    variant="danger"
                    size="md"
                    className="rounded-3xl"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Form"}
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
