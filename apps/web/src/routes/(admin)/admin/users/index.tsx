import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Button, Icon, Modal, Select } from "@formdrop/ui";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Login03Icon,
  UnfoldMoreIcon,
  UserBlock01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import { authClient } from "@/lib/auth-client";

/**
 * The cross-tenant users table (PRD 4.6).
 *
 * Rebuilt on the account dashboard's language -- panel surfaces, the ink and
 * tint ramps, the same pill treatment the submissions table uses -- rather
 * than the stock greys and purple/red/green badges it carried.
 *
 * The table itself is unchanged in behaviour: TanStack Table with client-side
 * sorting, filtering and pagination, all mirrored into the URL so a filtered
 * view can be linked.
 */
export const Route = createFileRoute("/(admin)/admin/users/")({
  component: AdminUsers,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search?.page ?? 1),
    pageSize: Number(search?.pageSize ?? 10),
    sortBy: (search?.sortBy as string) ?? "createdAt",
    sortOrder: (search?.sortOrder as "asc" | "desc") ?? "desc",
    search: (search?.search as string) ?? "",
  }),
});

/**
 * Declared by hand, unavoidably.
 *
 * Everywhere else in the app a row type is derived from the query or the
 * handler that produces it. This one comes from Better Auth's admin plugin,
 * which types listUsers' payload as `any` -- so there is nothing to derive
 * from and this is a contract we are asserting rather than reading.
 *
 * createdAt is `string | Date` for the same reason: the value arrives as JSON,
 * but the client may hand back a parsed Date, and with `any` upstream there is
 * no way to be sure which. The cell coerces rather than trusting either.
 */
type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  banned?: boolean;
  createdAt: string | Date;
};

const columnHelper = createColumnHelper<AdminUser>();

/** Matches the pills on the submissions and notifications screens. */
function Pill({
  tone,
  children,
}: {
  tone: "accent" | "neutral" | "good" | "bad";
  children: React.ReactNode;
}) {
  const tones = {
    accent: "bg-accent-500/12 text-accent-700",
    neutral: "bg-ink-100 text-ink-600",
    good: "bg-tint-green text-tint-green-ink",
    bad: "bg-tint-rose text-tint-rose-ink",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function AdminUsers() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const [globalFilter, setGlobalFilter] = useState(searchParams.search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: searchParams.sortBy, desc: searchParams.sortOrder === "desc" },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [banning, setBanning] = useState<AdminUser | null>(null);
  const [isBanning, setIsBanning] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      // Everything is filtered and paged in the browser, so the whole list is
      // fetched once. Fine at this size; it is the thing to revisit first if
      // the platform outgrows a thousand accounts.
      const res = await authClient.admin.listUsers({ query: { limit: 1000 } });
      return (res.data?.users ?? []) as AdminUser[];
    },
  });

  const openUser = (userId: string) =>
    navigate({ to: "/admin/users/$userId", params: { userId } });

  const impersonate = async (userId: string) => {
    await authClient.admin.impersonateUser({ userId });
    window.location.href = "/app";
  };

  const confirmBan = async () => {
    if (!banning) return;
    setIsBanning(true);
    try {
      await authClient.admin.banUser({
        userId: banning.id,
        banReason: "Admin action",
      });
      window.location.reload();
    } finally {
      setIsBanning(false);
    }
  };

  // Built here rather than at module scope so the actions can reach state --
  // the ban flow needs to open a dialog, which a module-level function cannot.
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="font-medium text-ink-950">
            {info.getValue() || "Unnamed"}
          </span>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => <span className="text-ink-600">{info.getValue()}</span>,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <Pill tone={info.getValue() === "admin" ? "accent" : "neutral"}>
            {info.getValue() || "user"}
          </Pill>
        ),
      }),
      columnHelper.accessor("banned", {
        header: "Status",
        cell: (info) => (
          <Pill tone={info.getValue() ? "bad" : "good"}>
            {info.getValue() ? "Banned" : "Active"}
          </Pill>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Joined",
        cell: (info) => (
          <span className="whitespace-nowrap text-ink-500 tabular-nums">
            {moment(info.getValue()).format("MMM D, YYYY")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const user = info.row.original;
          return (
            // Stops the row handler firing underneath: without this, banning
            // someone would also navigate to their page.
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Link to="/admin/users/$userId" params={{ userId: user.id }}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`View ${user.email}`}
                  icon={<Icon icon={ViewIcon} size={15} />}
                />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => impersonate(user.id)}
                aria-label={`Sign in as ${user.email}`}
                icon={<Icon icon={Login03Icon} size={15} />}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-tint-rose-ink hover:bg-tint-rose"
                onClick={() => setBanning(user)}
                aria-label={`Ban ${user.email}`}
                icon={<Icon icon={UserBlock01Icon} size={15} />}
              />
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    // Empty on purpose: the cells close over setBanning and openUser, both of
    // which are stable for the life of the component, so there is nothing here
    // that would make the columns need rebuilding.
    [],
  );

  const table = useReactTable({
    data: users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: searchParams.page - 1,
        pageSize: searchParams.pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({
              pageIndex: searchParams.page - 1,
              pageSize: searchParams.pageSize,
            })
          : updater;
      navigate({
        search: (prev) => ({
          ...prev,
          page: next.pageIndex + 1,
          pageSize: next.pageSize,
        }),
      });
    },
  });

  // Mirror sorting into the URL, so a sorted view can be linked.
  useEffect(() => {
    if (sorting.length === 0) return;
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? "desc" : "asc",
      }),
    });
  }, [sorting, navigate]);

  // Debounced, because this runs on every keystroke and each one is a
  // navigation.
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: globalFilter, page: 1 }),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter, navigate]);

  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
        Users
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Every account on the platform, and what to do about one.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
          <div className="border-b border-ink-100 px-4 py-3">
            <div className="h-8 w-64 animate-pulse rounded-xl bg-ink-100" />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center gap-4 border-b border-ink-100 px-4 py-4 last:border-b-0"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-52 animate-pulse rounded bg-ink-100" />
              <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const firstShown = rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const lastShown = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div>
      {header}

      <div className="animate-enter-late mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
        {/* Controls live in the panel's own header, the way the submissions
            table carries its column menu, rather than in a separate card
            floating above it. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
          {/* Sized to its content rather than stretched across the panel. A
              search box does not become more useful at 700px, and a full-width
              one reads as the primary thing on a screen whose primary thing is
              the table. */}
          <input
            type="search"
            placeholder="Search by name or email"
            aria-label="Search users"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-ink-200 px-3 py-1.5 text-sm text-ink-950 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none sm:w-64"
          />
          <Select
            label="Rows per page"
            value={searchParams.pageSize}
            options={[10, 25, 50, 100].map((n) => ({
              value: n,
              label: `${n} per page`,
            }))}
            onChange={(pageSize) =>
              navigate({ search: (prev) => ({ ...prev, pageSize, page: 1 }) })
            }
            className="w-auto shrink-0"
          />
        </div>

        {/* Grows with the rows up to a ceiling, then scrolls -- the same
            treatment the forms list has. 26rem rather than the submissions
            table's 32rem, because this panel also carries a toolbar and a
            pagination footer. */}
        <div className="max-h-[26rem] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-ink-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-ink-200">
                  {headerGroup.headers.map((header) => {
                    const sortable = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          !sortable || !sorted
                            ? undefined
                            : sorted === "asc"
                              ? "ascending"
                              : "descending"
                        }
                        className="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-ink-500 uppercase"
                      >
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {/* An icon rather than the "⇅" character the old
                                version used -- that rendered at whatever the
                                system font felt like and sat off the
                                baseline. */}
                            <Icon
                              icon={
                                sorted === "asc"
                                  ? ArrowUp01Icon
                                  : sorted === "desc"
                                    ? ArrowDown01Icon
                                    : UnfoldMoreIcon
                              }
                              size={13}
                              className={
                                sorted ? "text-accent-600" : "text-ink-300"
                              }
                            />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-ink-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12">
                    <p className="text-center text-sm text-ink-500">
                      {globalFilter
                        ? `No account matches "${globalFilter}".`
                        : "No accounts yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  /*
                   * The whole row opens the account, so the role, the name and
                   * the join date are all live -- not just the small eye icon
                   * at the end of it.
                   *
                   * A <tr> cannot be wrapped in a link, and a stretched
                   * overlay inside a table cell does not position reliably, so
                   * this is a click handler with a keyboard equivalent rather
                   * than an anchor. The action buttons stop propagation, or
                   * banning someone would also navigate to them.
                   */
                  <tr
                    key={row.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ${row.original.email}`}
                    onClick={() => openUser(row.original.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openUser(row.original.id);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-accent-500/4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3">
          <p className="text-xs text-ink-500 tabular-nums">
            {filteredCount === 0
              ? "No results"
              : `${firstShown}-${lastShown} of ${filteredCount.toLocaleString()}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-xs text-ink-500 tabular-nums">
              Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/*
        A dialog rather than window.confirm. Banning is the most consequential
        thing on this screen and the browser prompt could not say who it was
        about -- it read "Are you sure you want to ban this user?" with no name
        on it. Every other destructive action in the product confirms this way.
      */}
      <Modal
        isOpen={banning !== null}
        onClose={() => setBanning(null)}
        label="Ban this account?"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ink-950">
            Ban this account?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            <span className="font-medium text-ink-950">{banning?.email}</span>{" "}
            will be signed out and blocked from signing in again. Their forms
            keep collecting submissions.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBanning(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmBan} isLoading={isBanning}>
              Ban account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
