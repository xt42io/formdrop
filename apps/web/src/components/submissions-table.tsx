import { useMemo } from "react";
import { Icon } from "@formdrop/ui";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import type { Submission } from "@/lib/app-client";
import { DataTable, type DataTableColumnMeta } from "./table/data-table";
import { useSavedViews } from "./submissions/saved-views";
import { ViewsMenu } from "./submissions/views-menu";

/**
 * The submissions table (PRD 4.5, "the workhorse view").
 *
 * The table is DataTable, shared with the admin screens. What is left here is
 * the thing that is only true of this one: its columns are the form's own
 * payload fields, so they are derived from the rows rather than declared, and
 * they change as a form gains fields.
 *
 * That derivation is why this table could not simply become an admin table
 * with different columns, and why the shared component takes ColumnDefs rather
 * than owning them.
 */
const HIDDEN_COLUMNS_KEY = "formdrop:submissions-hidden-columns";

/*
 * Column widths, in pixels, because table-layout: fixed needs them declared
 * rather than inferred. The table is allowed to be wider than its container --
 * the payload columns keep a readable width and the container scrolls.
 */
const RECEIVED_W = 148;
const PAYLOAD_W = 180;
const IP_W = 132;

/** A measured row: py-3 top and bottom against a text-xs line box. */
const ROW_H = 41;

function truncate(value: string, max = 60) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "-";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export interface SubmissionsTableProps {
  formId: string;
  submissions: Submission[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpen: (submission: Submission) => void;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

export function SubmissionsTable({
  formId,
  submissions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onEndReached,
  isFetchingNextPage,
}: SubmissionsTableProps) {
  const payloadKeys = useMemo(
    () =>
      Array.from(new Set(submissions.flatMap((s) => Object.keys(s.payload)))),
    [submissions],
  );

  const { views, save, remove } = useSavedViews(formId);

  const columns = useMemo<ColumnDef<Submission, unknown>[]>(
    () => [
      {
        id: "createdAt",
        header: "Received",
        size: RECEIVED_W,
        // Sorting a partially loaded list would order the rows fetched so far
        // and quietly present that as the order of the whole set.
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-ink-700 tabular-nums">
            {moment(row.original.createdAt).format("MMM D, h:mm A")}
          </span>
        ),
      },
      // The column id is the payload key itself, which is what makes a saved
      // view portable: a view stores field names, and those are the ids.
      ...payloadKeys.map<ColumnDef<Submission, unknown>>((key) => ({
        id: key,
        header: key,
        size: PAYLOAD_W,
        // The form named this field, not us.
        meta: { identifierHeader: true } satisfies DataTableColumnMeta,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-ink-700">
            {truncate(cellText(row.original.payload[key]))}
          </span>
        ),
      })),
      {
        id: "ip",
        header: "IP",
        size: IP_W,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-500">
            {row.original.ip || "-"}
          </span>
        ),
      },
    ],
    [payloadKeys],
  );

  return (
    <DataTable
      tableId={`submissions:${formId}`}
      // The key this table has always written to. Changing it would silently
      // forget every reader's column layout on the one screen where hiding
      // columns is routine.
      prefsKey={`${HIDDEN_COLUMNS_KEY}:${formId}`}
      className="mt-3"
      data={submissions}
      columns={columns}
      getRowId={(submission) => submission.id}
      rowHeight={ROW_H}
      columnsHeading="Payload fields"
      columnsMonospace
      summary={
        selectedIds.length > 0
          ? `${selectedIds.length} selected`
          : `${submissions.length.toLocaleString()} loaded`
      }
      toolbar={({ hidden, setHidden }) =>
        payloadKeys.length > 0 ? (
          <ViewsMenu
            views={views}
            hidden={hidden}
            onApply={(view) => setHidden(view.hidden)}
            onSave={(name) => save(name, hidden)}
            onDelete={remove}
          />
        ) : null
      }
      selection={{
        selectedIds,
        onToggle: onToggleSelect,
        onToggleAll: onToggleSelectAll,
        selectAllLabel: "Select all loaded submissions",
        selectRowLabel: (submission) =>
          `Select submission from ${moment(submission.createdAt).format("MMM D, h:mm A")}`,
      }}
      paging={{ mode: "infinite", onEndReached, isFetchingNextPage }}
      onRowActivate={onOpen}
      emptyMessage={() => "No submissions yet."}
      // Explains a half-empty table, so hidden columns do not read as missing
      // data.
      footNote={({ hidden }) =>
        hidden.length > 0 ? (
          <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-xs text-ink-500">
            <Icon icon={Cancel01Icon} size={12} />
            {hidden.length} column{hidden.length === 1 ? "" : "s"} hidden
          </div>
        ) : null
      }
    />
  );
}
