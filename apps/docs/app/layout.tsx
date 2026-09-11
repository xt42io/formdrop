import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Analytics } from "./analytics";
import "./global.css";

/**
 * The docs shell.
 *
 * Light only, per D5: "Fumadocs ships a dark theme by default -- it gets
 * disabled, so docs match the rest of the product." `forcedTheme` is what
 * actually disables it; leaving the theme switcher on would offer readers a
 * dark mode the rest of formdrop.co does not have.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Analytics />
        <RootProvider theme={{ enabled: false, forcedTheme: "light" }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
