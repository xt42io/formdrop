import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { capture } from "@formdrop/analytics";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { CodePreview } from "@/components/landing/code-preview";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { FrontendFrameworks } from "@/components/landing/frontend-frameworks";
import { Integrations } from "@/components/landing/integrations";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export const Route = createFileRoute("/(marketing)/")({
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {
    capture("landing_viewed");
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-white">
      <HeroBackdrop />
      <Navbar />
      {/* The page had no main landmark, so "skip to content" had nothing to
          skip to and a screen reader could not jump past the nav. The nav and
          the footer stay outside it -- they are not the page's content. */}
      <main>
        <Hero />
        <CodePreview />
        <FeaturesGrid />
        <FrontendFrameworks />
        <Integrations />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
