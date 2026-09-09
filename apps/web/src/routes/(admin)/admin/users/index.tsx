import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Icon, Modal } from "@formdrop/ui";
import {
  Login03Icon,
  UserBlock01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import { authClient } from "@/lib/auth-client";
import { AdminTable } from "@/components/admin/admin-table";
import { Pill } from "@/components/admin/pill";

/**
 * The cross-tenant users table (PRD 4.6).
 *
 * The table itself is AdminTable, shared with the forms screen -- the toolbar,
 * the sticky header, the sorting and the pagination are the same code, not a
 * second copy of it. What lives here is the columns and the ban flow.
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

function AdminUsers() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Users
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Every account on the platform, and what to do about one.
        </p>
      </div>

      <AdminTable
        data={users ?? []}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by name or email"
        searchLabel="Search users"
        emptyMessage={(query) =>
          query ? `No account matches "${query}".` : "No accounts yet."
        }
        searchParams={searchParams}
        onSearchParamsChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, ...next }) })
        }
        onRowClick={(user) => openUser(user.id)}
        rowLabel={(user) => `Open ${user.email}`}
      />

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
