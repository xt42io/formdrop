import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { appClient, type Submission } from "@/lib/app-client";
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
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CopyButton } from "@/components/copy-button";
import { Button, Icon, Modal } from "@formdrop/ui";
import { SubmissionsTable } from "@/components/submissions-table";

import { useIsPro } from "@/hooks/use-is-pro";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/(app)/app/forms/$id/submissions")({
  head: () => ({
    meta: [{ title: "Submissions | FormDrop" }],
  }),
  component: RouteComponent,
});

type ViewMode = "card" | "table";
type ExportFormat = "csv" | "json" | "xlsx";

// Submission is derived from the query that produces it, in app-client. The
// local copy this replaces declared createdAt as a Date, which it never was
// once the handler had put it through Response.json().

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
        <div className="py-3 border-b border-ink-200 last:border-0">
          <label className="text-sm font-medium text-ink-700">{fieldKey}</label>
          <div className="mt-2 space-y-2">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="bg-ink-50 px-3 py-2 rounded-lg text-sm text-ink-950"
              >
                {typeof item === "object" ? JSON.stringify(item) : String(item)}
              </div>
            ))}
            {value.length > 3 && !expanded && (
              <Button
                onClick={() => setExpanded(true)}
                variant="ghost"
                size="sm"
                className="text-accent hover:text-accent-600 font-medium p-0 h-auto hover:bg-transparent"
                icon={<Icon icon={ArrowDown01Icon} size={14} />}
              >
                Show {value.length - 3} more
              </Button>
            )}
            {expanded && value.length > 3 && (
              <Button
                onClick={() => setExpanded(false)}
                variant="ghost"
                size="sm"
                className="text-accent hover:text-accent-600 font-medium p-0 h-auto hover:bg-transparent"
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
        <div className="py-3 border-b border-ink-200 last:border-0">
          <label className="text-sm font-medium text-ink-700">{fieldKey}</label>
          <div className="mt-2 bg-ink-50 px-3 py-2 rounded-lg">
            <pre className="text-sm text-ink-950 whitespace-pre-wrap wrap-break-word">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="py-3 border-b border-ink-200 last:border-0">
        <label className="text-sm font-medium text-ink-700">{fieldKey}</label>
        <p className="text-sm text-ink-950 mt-1">{String(value)}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-x-3">
            <Link
              to="/app/forms"
              className="hover:bg-ink-100 p-2 rounded-lg transition-colors"
            >
              <Icon icon={ArrowLeft01Icon} />
            </Link>
            <h2 className="text-lg font-semibold">Submissions</h2>
          </div>
        </div>
        {/* Shaped like the table it precedes, not like the cards that are no
            longer the default view -- a skeleton that resolves into a
            different layout is worse than showing none at all. */}
        <div className="mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
          <div className="border-b border-ink-200 bg-ink-50/60 px-4 py-3">
            <div className="h-3 w-24 animate-pulse rounded bg-ink-200" />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center gap-6 border-b border-ink-100 px-4 py-4 last:border-b-0"
            >
              <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-ink-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-ink-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-ink-100" />
              <div className="h-3 flex-1 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-x-3">
            <Link
              to="/app/forms"
              className="hover:bg-ink-100 p-2 rounded-lg transition-colors"
            >
              <Icon icon={ArrowLeft01Icon} />
            </Link>
            <h2 className="text-lg font-semibold">Submissions</h2>
          </div>
        </div>
        <div className="mt-4 p-5 border border-tint-rose rounded-3xl bg-tint-rose">
          <p className="text-tint-rose-ink text-sm">
            Failed to load submissions: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* top-[69px] clears the form header above it. That header is shorter
          below sm (a smaller title, a wrapped button row), so the offset has
          to be too, or this bar sticks with a gap under the one above it. */}
      <div className="sticky top-[57px] z-10 flex flex-wrap items-center justify-between gap-2 bg-white py-2 sm:top-[69px]">
        <div className="flex items-center gap-x-3">
          <Link
            to="/app/forms"
            className="hover:bg-ink-100 p-2 rounded-lg transition-colors"
          >
            <Icon icon={ArrowLeft01Icon} />
          </Link>
          <h2 className="text-lg font-semibold">
            Submissions
            {!isLoading && submissions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-ink-500">
                (Showing {submissions.length.toLocaleString()} of{" "}
                {totalSubmissions.toLocaleString()})
              </span>
            )}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selectedSubmissionIds.length > 0 && (
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="danger"
              size="sm"
              icon={<Icon icon={Delete02Icon} />}
            >
              Delete ({selectedSubmissionIds.length})
            </Button>
          )}
          <Button
            onClick={() => setShowExportModal(true)}
            variant="secondary"
            size="sm"
            className="text-ink-600 hover:bg-ink-100 border-ink-200"
            icon={<Icon icon={Download01Icon} />}
          >
            Export
          </Button>
          <div className="w-px h-6 bg-ink-200 mx-1"></div>
          <Button
            onClick={() => setViewMode("card")}
            variant={viewMode === "card" ? "primary" : "ghost"}
            size="sm"
            className={`p-2 ${viewMode === "card" ? "" : "text-ink-600 hover:bg-ink-100"}`}
            icon={<Icon icon={GridIcon} />}
          />
          <Button
            onClick={() => setViewMode("table")}
            variant={viewMode === "table" ? "primary" : "ghost"}
            size="sm"
            className={`p-2 ${viewMode === "table" ? "" : "text-ink-600 hover:bg-ink-100"}`}
            icon={<Icon icon={TableIcon} />}
          />
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="mt-4 p-8 border border-ink-200 rounded-3xl text-center">
          <p className="text-ink-500 text-sm mb-4">
            No submissions yet for this form.
          </p>
          <Button
            onClick={() => setShowIntegrationModal(true)}
            variant="primary"
            size="md"
            className="rounded-xl"
            icon={<Icon icon={CodeIcon} />}
          >
            Show Integration Guide
          </Button>
        </div>
      ) : viewMode === "card" ? (
        // Same ceiling as the table view, so switching between the two does
        // not change how much of the page the list occupies. Grows with the
        // cards up to it, then scrolls.
        <div className="mt-3 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-5 border border-ink-200 rounded-3xl hover:border-accent-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-xs text-ink-600 mb-1">{submission.id}</p>
                  <p className="text-xs text-ink-500">
                    {moment(submission.createdAt).format(
                      "MMM DD, YYYY [at] h:mm A",
                    )}
                  </p>
                </div>
              </div>
              <div className="bg-ink-50 p-4 rounded-2xl overflow-hidden">
                <pre className="text-xs text-ink-700 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                  {JSON.stringify(submission.payload, null, 2)}
                </pre>
              </div>
              {(submission.ip || submission.userAgent) && (
                <div className="mt-3 pt-3 border-t border-ink-200">
                  {submission.ip && (
                    <p className="text-xs text-ink-500">IP: {submission.ip}</p>
                  )}
                  {submission.userAgent && (
                    <p className="text-xs text-ink-500 mt-1">
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
                <Icon
                  icon={Loading03Icon}
                  className="animate-spin text-ink-400"
                  size={24}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <SubmissionsTable
          formId={id}
          submissions={submissions}
          selectedIds={selectedSubmissionIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpen={setSelectedSubmission}
          lastRowRef={lastSubmissionElementRef}
          isFetchingNextPage={isFetchingNextPage}
        />
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl overflow-y-auto border-l border-ink-200 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-ink-200 p-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Submission Details</h3>
                <Button
                  onClick={() => setSelectedSubmission(null)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-ink-100 p-2 h-auto"
                  icon={<Icon icon={Cancel01Icon} size={20} />}
                />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-medium text-ink-600">
                    Submission ID
                  </label>
                  <p className="text-sm text-ink-950 mt-1">
                    {selectedSubmission.id}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-600 block mb-3">
                    Payload
                  </label>
                  <div className="space-y-0 border border-ink-200 rounded-2xl overflow-hidden">
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
                  <label className="text-xs font-medium text-ink-600">
                    Timestamp
                  </label>
                  <p className="text-sm text-ink-950 mt-1">
                    {moment(selectedSubmission.createdAt).format(
                      "MMMM DD, YYYY [at] h:mm:ss A",
                    )}
                  </p>
                </div>

                {selectedSubmission.ip && (
                  <div>
                    <label className="text-xs font-medium text-ink-600">
                      IP Address
                    </label>
                    <p className="text-sm text-ink-950 mt-1">
                      {selectedSubmission.ip}
                    </p>
                  </div>
                )}

                {selectedSubmission.userAgent && (
                  <div>
                    <label className="text-xs font-medium text-ink-600">
                      User Agent
                    </label>
                    <p className="text-sm text-ink-950 mt-1 break-all">
                      {selectedSubmission.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        label="Delete Submissions"
        scrim="bg-black/50"
        radius="rounded-2xl"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-tint-rose flex items-center justify-center text-tint-rose-ink">
              <Icon icon={AlertCircleIcon} size={20} />
            </div>
            <h3 className="text-lg font-semibold text-ink-950">
              Delete Submissions
            </h3>
          </div>
          <p className="text-ink-600 text-sm">
            Are you sure you want to delete {selectedSubmissionIds.length}{" "}
            selected submission
            {selectedSubmissionIds.length > 1 ? "s" : ""}? This action cannot be
            undone.
          </p>
        </div>
        <div className="bg-ink-50 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            variant="secondary"
            size="md"
            className="rounded-lg bg-transparent border-transparent hover:bg-ink-100"
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
                <Icon icon={Delete02Icon} size={16} />
              )
            }
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        label="Export Submissions"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-ink-950">
              Export Submissions
            </h3>
            <Button
              onClick={() => setShowExportModal(false)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-ink-100 rounded-lg h-auto"
              icon={<Icon icon={Cancel01Icon} size={20} />}
            />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
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
                        : "bg-white text-ink-700 border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Filename
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  className="flex-1 px-3 py-2 border border-ink-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-black/5 border-r-0"
                />
                <div className="px-3 py-2 bg-ink-50 border border-ink-300 border-l-0 rounded-r-xl text-ink-500 text-sm">
                  .{exportFormat}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 p-3 border border-ink-200 rounded-xl cursor-pointer hover:bg-ink-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 text-black border-ink-300 rounded focus:ring-black"
                />
                <div className="text-sm">
                  <span className="font-medium text-ink-950">
                    Include technical details
                  </span>
                  <p className="text-ink-500 text-xs mt-0.5">
                    Adds IP address, User Agent, and raw JSON payload to the
                    export
                  </p>
                </div>
              </label>
            </div>

            {!isPro && (
              <div className="bg-ink-950 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                <div className="relative flex gap-3">
                  <div className="p-2 bg-white/10 rounded-lg h-fit shrink-0">
                    <Icon
                      icon={StarIcon}
                      size={20}
                      className="text-yellow-400"
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-white">
                      Unlock Unlimited Exports
                    </p>
                    <p className="mt-1 text-ink-300 leading-relaxed">
                      Free plans are limited to the most recent 1,000
                      submissions. Upgrade to Pro to export everything.
                    </p>
                    <Link
                      to="/app/settings"
                      search={{ tab: "billing" }}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white hover:text-ink-200 transition-colors"
                    >
                      Upgrade to Pro
                      <Icon icon={ArrowRight01Icon} size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowExportModal(false)}>
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
      </Modal>

      <Modal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        size="3xl"
        label={`Integrate ${formName}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-ink-950">
              Integrate {formName}
            </h3>
            <Button
              onClick={() => setShowIntegrationModal(false)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-ink-100 rounded-lg h-auto"
              icon={<Icon icon={Cancel01Icon} size={20} />}
            />
          </div>

          <div className="border rounded-3xl border-ink-200 p-4">
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
                  <Icon
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
                  <Icon
                    icon={JavaScriptIcon}
                    className="text-yellow-500"
                    size={24}
                  />
                }
              />
            </div>
            <div className="border rounded-3xl border-ink-200 p-4 mt-5 relative bg-ink-50/50">
              <CopyButton
                text={
                  selectedTab === "html" ? htmlCodeExample : fetchCodeExample
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
      </Modal>
    </div>
  );
}
