import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/button";
import {
  ArrowLeft01Icon,
  UserIcon,
  Mail01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export const Route = createFileRoute("/admin/users/$userId")({
  component: AdminUserDetail,
});

type UserDetail = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  forms: Array<{
    id: string;
    name: string;
    createdAt: Date;
    submissionCount: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    formId: string;
    formName: string;
    createdAt: Date;
  }>;
};

const formColumnHelper = createColumnHelper<UserDetail["forms"][0]>();

const formColumns = [
  formColumnHelper.accessor("name", {
    header: "Form Name",
    cell: (info) => (
      <div className="font-medium text-gray-900">{info.getValue()}</div>
    ),
  }),
  formColumnHelper.accessor("submissionCount", {
    header: "Submissions",
    cell: (info) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {info.getValue()?.toLocaleString() || 0}
      </span>
    ),
  }),
  formColumnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleDateString()}
      </div>
    ),
  }),
  formColumnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <Link to="/app/forms/$id" params={{ id: info.row.original.id }}>
        <Button variant="outline" size="sm">
          View
        </Button>
      </Link>
    ),
  }),
];

const submissionColumnHelper =
  createColumnHelper<UserDetail["recentSubmissions"][0]>();

const submissionColumns = [
  submissionColumnHelper.accessor("formName", {
    header: "Form Name",
    cell: (info) => (
      <div className="font-medium text-gray-900">{info.getValue()}</div>
    ),
  }),
  submissionColumnHelper.accessor("id", {
    header: "Submission ID",
    cell: (info) => (
      <div className="text-gray-500 font-mono text-xs">
        {info.getValue().slice(0, 8)}...
      </div>
    ),
  }),
  submissionColumnHelper.accessor("createdAt", {
    header: "Submitted",
    cell: (info) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleString()}
      </div>
    ),
  }),
];

function AdminUserDetail() {
  const { userId } = Route.useParams();

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/users/${userId}`);
      return res.data.user as UserDetail;
    },
  });

  const formsTable = useReactTable({
    data: user?.forms || [],
    columns: formColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const submissionsTable = useReactTable({
    data: user?.recentSubmissions || [],
    columns: submissionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/users"
          search={{
            page: 1,
            pageSize: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
            search: "",
          }}
        >
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Back to Users
          </Button>
        </Link>
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/users"
          search={{
            page: 1,
            pageSize: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
            search: "",
          }}
        >
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* User Info Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <HugeiconsIcon icon={UserIcon} size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 font-mono text-sm">{user.id}</p>
            </div>
          </div>
          {user.role === "admin" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Admin
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
            <HugeiconsIcon
              icon={Mail01Icon}
              size={20}
              className="text-gray-400"
            />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Email
              </div>
              <div className="font-medium text-gray-900">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
            <HugeiconsIcon
              icon={user.emailVerified ? CheckmarkCircle02Icon : Cancel01Icon}
              size={20}
              className={
                user.emailVerified ? "text-green-500" : "text-gray-400"
              }
            />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Email Status
              </div>
              <div className="font-medium text-gray-900">
                {user.emailVerified ? "Verified" : "Not Verified"}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={20}
              className="text-gray-400"
            />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Joined
              </div>
              <div className="font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
            <HugeiconsIcon
              icon={user.banned ? Cancel01Icon : CheckmarkCircle02Icon}
              size={20}
              className={user.banned ? "text-red-500" : "text-green-500"}
            />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Account Status
              </div>
              <div className="font-medium text-gray-900">
                {user.banned ? "Banned" : "Active"}
              </div>
            </div>
          </div>
        </div>

        {user.banned && user.banReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="text-sm font-medium text-red-800 mb-1">
              Ban Reason
            </div>
            <div className="text-sm text-red-600">{user.banReason}</div>
            {user.banExpires && (
              <div className="text-xs text-red-500 mt-2">
                Expires: {new Date(user.banExpires).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User's Forms */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Forms ({user.forms.length})
        </h3>
        {user.forms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No forms created yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {formsTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {formsTable.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Recent Submissions ({user.recentSubmissions.length})
        </h3>
        {user.recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No submissions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {submissionsTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {submissionsTable.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
