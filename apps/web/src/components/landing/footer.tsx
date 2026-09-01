import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <img src="/purple_icon.svg" alt="FormDrop Logo" className="w-7" />
        </Link>

        <div className="flex gap-8 text-sm">
          <Link
            to="/privacy"
            className="text-ink-500 transition-colors hover:text-ink-900"
          >
            Privacy Policy
          </Link>
        </div>

        <p className="text-sm text-ink-400">
          &copy; {new Date().getFullYear()} FormDrop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
