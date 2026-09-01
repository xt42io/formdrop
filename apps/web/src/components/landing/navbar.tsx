import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = authClient.useSession();

  const links = [
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
    ...(!session ? [{ href: "/login", label: "Login" }] : []),
  ];

  return (
    <div className="sticky top-0 z-50 p-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl border border-ink-200/80 bg-white/75 py-2.5 pr-2.5 pl-5 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/purple_icon.svg" alt="" className="w-6" />
          <span className="font-semibold tracking-tight text-ink-950">
            FormDrop
          </span>
        </Link>

        <div className="hidden gap-x-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-950"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          to={session ? "/app/forms" : "/signup"}
          className="rounded-2xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
        >
          {session ? "Dashboard" : "Get started"}
        </Link>
      </div>
    </div>
  );
}
