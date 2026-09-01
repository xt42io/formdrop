import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/purple_icon.svg" alt="FormDrop Logo" className="w-7" />
        </Link>
        <div className="flex gap-8 text-sm text-gray-500">
          {/* <Link to="/pricing" className="hover:text-gray-900">
            Pricing
          </Link>
          <Link to="/docs" className="hover:text-gray-900">
            Documentation
          </Link> */}
          <Link to="/privacy" className="hover:text-gray-900">
            Privacy Policy
          </Link>
        </div>
        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} FormDrop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
