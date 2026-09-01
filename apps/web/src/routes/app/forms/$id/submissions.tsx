import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import moment from "moment";
import {
  ArrowLeft01Icon,
  GridIcon,
  TableIcon,
  Cancel01Icon,
  ArrowDown01Icon,
  Download01Icon,
  Delete02Icon,
  AlertCircleIcon,
  Html5Icon,
  JavaScriptIcon,
  CodeIcon,
  Loading03Icon,
  StarIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/button";

import { useIsPro } from "@/hooks/use-is-pro";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/app/forms/$id/submissions")({
  head: () => ({
    meta: [{ title: "Submissions | FormDrop" }],
  }),
  component: RouteComponent,
});

type ViewMode = "card" | "table";
type ExportFormat = "csv" | "json" | "xlsx";

interface Submission {
  id: string;
  formId: string;
  payload: Record<string, any>;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

function RouteComponent() {
  const { id } = Route.useParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>(
    [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"html" | "fetch">("html");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportFilename, setExportFilename] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const { isPro } = useIsPro();

  const queryClient = useQueryClient();

  const { data: form } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const response = await appClient.forms.get(id);
      if ("error" in response) throw new Error(response.error);
      return response.form;
    },
  });

  useEffect(() => {
    if (form?.name) {
      setExportFilename(
        `submissions-${form.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
      );
    }
  }, [form?.name]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["submissions", id],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await appClient.submissions.list(id, pageParam, 50);
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const submissions = data?.pages.flatMap((page) => page.submissions) || [];
  const totalSubmissions = data?.pages[0]?.pagination.total || 0;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastSubmissionElementRef = useCallback(
    (node: HTMLDivElement | HTMLTableRowElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  useEffect(() => {
    if (!isLoading && submissions.length === 0) {
      setShowIntegrationModal(true);
    }
  }, [isLoading, submissions.length]);

  const formName = form?.name || "Contact Form";

  const htmlCodeExample = `<form
  action="https://api.formdrop.co/f/${form?.slug}" 
  method="POST">
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <button type="submit">Submit</button>
</form>`;

  const fetchCodeExample = `fetch('https://api.formdrop.co/f/${form?.slug}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john.doe@example.com"
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))
`;

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await appClient.submissions.bulkDelete(id, ids);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", id] });
      setSelectedSubmissionIds([]);
      setShowDeleteConfirm(false);
    },
  });

  const toggleSelectAll = () => {
    if (selectedSubmissionIds.length === submissions.length) {
      setSelectedSubmissionIds([]);
    } else {
      setSelectedSubmissionIds(submissions.map((s) => s.id));
    }
  };

  const toggleSelect = (submissionId: string) => {
    if (selectedSubmissionIds.includes(submissionId)) {
      setSelectedSubmissionIds(
        selectedSubmissionIds.filter((id) => id !== submissionId),
      );
    } else {
      setSelectedSubmissionIds([...selectedSubmissionIds, submissionId]);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(selectedSubmissionIds);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/forms/${id}/export?format=${exportFormat === "xlsx" ? "json" : exportFormat}&includeMetadata=${includeMetadata}`,
      );
      if (!response.ok) throw new Error("Export failed");

      if (exportFormat === "xlsx") {
        const data = await response.json();
        const worksheet = XLSX.utils.json_to_sheet(
          data.map((sub: any) => {
            const row: any = {
              ID: sub.id,
              "Created At": sub.createdAt,
              ...sub.payload,
            };
            if (includeMetadata) {
              row.IP = sub.ip;
              row["User Agent"] = sub.userAgent;
              row["Payload (JSON)"] = JSON.stringify(sub.payload);
            }
            return row;
          }),
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, `${exportFilename}.xlsx`);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportFilename}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const PayloadField = ({
    fieldKey,
    value,
  }: {
    fieldKey: string;
    value: any;
  }) => {
    const [expanded, setExpanded] = useState(false);

    if (Array.isArray(value)) {
      const displayItems = expanded ? value : value.slice(0, 3);
      return (
        <div className="py-3 border-b border-gray-200 last:border-0">
          <label className="text-sm font-medium text-gray-700">
            {fieldKey}
          </label>
          <div className="mt-2 space-y-2">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-900"
              >
                {typeof item === "object" ? JSON.stringify(item) : String(item)}
              </div>
            ))}
            {value.length > 3 && !expanded && (
              <Button
                onClick={() => setExpanded(true)}
                variant="ghost"
                size="sm"
                className="text-accent hover:text-accent/80 font-medium p-0 h-auto hover:bg-transparent"
                icon={<HugeiconsIcon icon={ArrowDown01Icon} size={14} />}
              >
                Show {value.length - 3} more
              </Button>
            )}
            {expanded && value.length > 3 && (
              <Button
                onClick={() => setExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-accent hover:text-accent/80 font-medium p-0 h-auto hover:bg-transparent"
              >
                Show less
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div className="py-3 border-b border-gray-200 last:border-0">
          <label className="text-sm font-medium text-gray-700">
            {fieldKey}
          </label>
          <div className="mt-2 bg-gray-50 px-3 py-2 rounded-lg">
            <pre className="text-sm text-gray-900 whitespace-pre-wrap wrap-break-word">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="py-3 border-b border-gray-200 last:border-0">
        <label className="text-sm font-medium text-gray-700">{fieldKey}</label>
        <p className="text-sm text-gray-900 mt-1">{String(value)}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-x-3">
            <Link
              to="/app/forms"
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
            <h2 className="text-lg font-semibold">Submissions</h2>
          </div>
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
          <div className="flex items-center gap-x-3">
            <Link
              to="/app/forms"
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
            <h2 className="text-lg font-semibold">Submissions</h2>
          </div>
        </div>
        <div className="mt-4 p-5 border border-red-200 rounded-3xl bg-red-50">
          <p className="text-red-600 text-sm">
            Failed to load submissions: {error.message}
          </p>
        </div>
      </div>
    );
  }

  const allKeys =
    submissions.length > 0
      ? Array.from(
          new Set(submissions.flatMap((sub) => Object.keys(sub.payload))),
        )
      : [];

  return (
    <div>
      <div className="sticky top-[69px] z-10 bg-white flex items-center justify-between py-2">
        <div className="flex items-center gap-x-3">
          <Link
            to="/app/forms"
            className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <h2 className="text-lg font-semibold">
            Submissions
            {!isLoading && submissions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Showing {submissions.length.toLocaleString()} of{" "}
                {totalSubmissions.toLocaleString()})
              </span>
            )}
          </h2>
        </div>
        <div className="flex gap-2 items-center">
          {selectedSubmissionIds.length > 0 && (
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="danger"
              size="sm"
              className="bg-red-50 text-red-600 hover:bg-red-100 border-transparent"
              icon={<HugeiconsIcon icon={Delete02Icon} size={18} />}
            >
              Delete ({selectedSubmissionIds.length})
            </Button>
          )}
          <Button
            onClick={() => setShowExportModal(true)}
            variant="secondary"
            size="sm"
            className="text-gray-600 hover:bg-gray-100 border-gray-200"
            icon={<HugeiconsIcon icon={Download01Icon} size={18} />}
          >
            Export
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <Button
            onClick={() => setViewMode("card")}
            variant={viewMode === "card" ? "primary" : "ghost"}
            size="sm"
            className={`p-2 ${viewMode === "card" ? "" : "text-gray-600 hover:bg-gray-100"}`}
            icon={<HugeiconsIcon icon={GridIcon} size={18} />}
          />
          <Button
            onClick={() => setViewMode("table")}
            variant={viewMode === "table" ? "primary" : "ghost"}
            size="sm"
            className={`p-2 ${viewMode === "table" ? "" : "text-gray-600 hover:bg-gray-100"}`}
            icon={<HugeiconsIcon icon={TableIcon} size={18} />}
          />
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="mt-4 p-8 border border-gray-200 rounded-3xl text-center">
          <p className="text-gray-500 text-sm mb-4">
            No submissions yet for this form.
          </p>
          <Button
            onClick={() => setShowIntegrationModal(true)}
            variant="primary"
            size="md"
            className="rounded-xl"
            icon={<HugeiconsIcon icon={CodeIcon} size={18} />}
          >
            Show Integration Guide
          </Button>
        </div>
      ) : viewMode === "card" ? (
        <div className="mt-4 space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-5 border border-gray-200 rounded-3xl hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">{submission.id}</p>
                  <p className="text-xs text-gray-500">
                    {moment(submission.createdAt).format(
                      "MMM DD, YYYY [at] h:mm A",
                    )}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl overflow-hidden">
                <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                  {JSON.stringify(submission.payload, null, 2)}
                </pre>
              </div>
              {(submission.ip || submission.userAgent) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {submission.ip && (
                    <p className="text-xs text-gray-500">IP: {submission.ip}</p>
                  )}
                  {submission.userAgent && (
                    <p className="text-xs text-gray-500 mt-1">
                      User Agent: {submission.userAgent}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={lastSubmissionElementRef} className="h-4 w-full">
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="animate-spin text-gray-400"
                  size={24}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 border border-gray-200 rounded-3xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                    checked={
                      submissions.length > 0 &&
                      selectedSubmissionIds.length === submissions.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">
                  Timestamp
                </th>
                {allKeys.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap"
                  >
                    {key}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedSubmissionIds.includes(submission.id)
                      ? "bg-accent/5"
                      : ""
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                      checked={selectedSubmissionIds.includes(submission.id)}
                      onChange={() => toggleSelect(submission.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    {moment(submission.createdAt).format("MMM DD, h:mm A")}
                  </td>
                  {allKeys.map((key) => {
                    const value = submission.payload[key];
                    const displayValue =
                      value !== undefined
                        ? typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)
                        : "-";
                    return (
                      <td
                        key={key}
                        className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap max-w-xs truncate"
                      >
                        {truncateText(displayValue)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {submission.ip || "-"}
                  </td>
                </tr>
              ))}
              <tr ref={lastSubmissionElementRef}>
                <td colSpan={allKeys.length + 3} className="p-0 border-0">
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="animate-spin text-gray-400"
                        size={24}
                      />
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Submission Details</h3>
                <Button
                  onClick={() => setSelectedSubmission(null)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 p-2 h-auto"
                  icon={<HugeiconsIcon icon={Cancel01Icon} size={20} />}
                />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Submission ID
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedSubmission.id}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-3">
                    Payload
                  </label>
                  <div className="space-y-0 border border-gray-200 rounded-2xl overflow-hidden">
                    {Object.entries(selectedSubmission.payload).map(
                      ([key, value]) => (
                        <div key={key} className="px-4 bg-white">
                          <PayloadField fieldKey={key} value={value} />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Timestamp
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {moment(selectedSubmission.createdAt).format(
                      "MMMM DD, YYYY [at] h:mm:ss A",
                    )}
                  </p>
                </div>

                {selectedSubmission.ip && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      IP Address
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSubmission.ip}
                    </p>
                  </div>
                )}

                {selectedSubmission.userAgent && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      User Agent
                    </label>
                    <p className="text-sm text-gray-900 mt-1 break-all">
                      {selectedSubmission.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <HugeiconsIcon icon={AlertCircleIcon} size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Submissions
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete {selectedSubmissionIds.length}{" "}
                  selected submission
                  {selectedSubmissionIds.length > 1 ? "s" : ""}? This action
                  cannot be undone.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  size="md"
                  className="rounded-lg bg-transparent border-transparent hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                  variant="danger"
                  size="md"
                  className="rounded-lg"
                  icon={
                    !deleteMutation.isPending && (
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    )
                  }
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Export Submissions
                  </h3>
                  <Button
                    onClick={() => setShowExportModal(false)}
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-100 rounded-lg h-auto"
                    icon={<HugeiconsIcon icon={Cancel01Icon} size={20} />}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["csv", "json", "xlsx"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                            exportFormat === format
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filename
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={exportFilename}
                        onChange={(e) => setExportFilename(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-black/5 border-r-0"
                      />
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-l-0 rounded-r-xl text-gray-500 text-sm">
                        .{exportFormat}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          Include technical details
                        </span>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Adds IP address, User Agent, and raw JSON payload to
                          the export
                        </p>
                      </div>
                    </label>
                  </div>

                  {!isPro && (
                    <div className="bg-gray-900 rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                      <div className="relative flex gap-3">
                        <div className="p-2 bg-white/10 rounded-lg h-fit shrink-0">
                          <HugeiconsIcon
                            icon={StarIcon}
                            size={20}
                            className="text-yellow-400"
                          />
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-white">
                            Unlock Unlimited Exports
                          </p>
                          <p className="mt-1 text-gray-300 leading-relaxed">
                            Free plans are limited to the most recent 1,000
                            submissions. Upgrade to Pro to export everything.
                          </p>
                          <Link
                            to="/app/settings"
                            search={{ tab: "billing" }}
                            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white hover:text-gray-200 transition-colors"
                          >
                            Upgrade to Pro
                            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowExportModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      isLoading={isExporting}
                    >
                      {isExporting
                        ? "Exporting..."
                        : `Export ${!isPro && totalSubmissions > 1000 ? "1,000" : totalSubmissions.toLocaleString()} Rows`}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Integration Modal */}
      <AnimatePresence>
        {showIntegrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIntegrationModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Integrate {formName}
                  </h3>
                  <Button
                    onClick={() => setShowIntegrationModal(false)}
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-100 rounded-lg h-auto"
                    icon={<HugeiconsIcon icon={Cancel01Icon} size={20} />}
                  />
                </div>

                <div className="border rounded-3xl border-gray-200 p-4">
                  <div className="flex items-center gap-x-4 relative">
                    <div
                      className={`absolute h-10 w-10 rounded-lg transition-all duration-300 ease-out ${
                        selectedTab === "html"
                          ? "bg-orange-100 ring-2 ring-orange-600 translate-x-0"
                          : "bg-yellow-100 ring-2 ring-yellow-500 translate-x-14"
                      }`}
                    />

                    <Button
                      onClick={() => setSelectedTab("html")}
                      variant="ghost"
                      size="sm"
                      className="p-2 rounded-lg relative z-10 hover:bg-black/5 h-auto"
                      icon={
                        <HugeiconsIcon
                          icon={Html5Icon}
                          className="text-orange-600"
                          size={24}
                        />
                      }
                    />
                    <Button
                      onClick={() => setSelectedTab("fetch")}
                      variant="ghost"
                      size="sm"
                      className="p-2 rounded-lg relative z-10 hover:bg-black/5 h-auto"
                      icon={
                        <HugeiconsIcon
                          icon={JavaScriptIcon}
                          className="text-yellow-500"
                          size={24}
                        />
                      }
                    />
                  </div>
                  <div className="border rounded-3xl border-gray-200 p-4 mt-5 relative bg-gray-50/50">
                    <CopyButton
                      text={
                        selectedTab === "html"
                          ? htmlCodeExample
                          : fetchCodeExample
                      }
                    />
                    {selectedTab === "html" ? (
                      <pre className="overflow-x-auto text-sm">
                        <code>{htmlCodeExample}</code>
                      </pre>
                    ) : (
                      <pre className="overflow-x-auto text-sm">
                        <code>{fetchCodeExample}</code>
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
