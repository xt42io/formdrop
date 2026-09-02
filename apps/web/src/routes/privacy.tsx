import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "../components/landing/navbar";
import { Footer } from "../components/landing/footer";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white">
      {/* the landing page's backdrop, so the two surfaces match */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_45%,transparent_92%)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <Navbar />
      <main className="grow px-6 pt-16 pb-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-950">
            Privacy Policy
          </h1>

          <div className="max-w-none">
            <p className="mb-10 text-sm text-ink-500">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                1. Introduction
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                Welcome to FormDrop ("we," "our," or "us"). We respect your
                privacy and are committed to protecting your personal data. This
                privacy policy will inform you as to how we look after your
                personal data when you visit our website and use our services,
                and tell you about your privacy rights and how the law protects
                you.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                2. Data We Collect
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together follows:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-[15px] leading-relaxed text-ink-600">
                <li>
                  <strong>Identity Data:</strong> includes first name, last
                  name, username or similar identifier.
                </li>
                <li>
                  <strong>Contact Data:</strong> includes email address and
                  telephone number.
                </li>
                <li>
                  <strong>Technical Data:</strong> includes internet protocol
                  (IP) address, your login data, browser type and version, time
                  zone setting and location, browser plug-in types and versions,
                  operating system and platform, and other technology on the
                  devices you use to access this website.
                </li>
                <li>
                  <strong>Usage Data:</strong> includes information about how
                  you use our website and services.
                </li>
                <li>
                  <strong>Form Data:</strong> includes the data submitted
                  through forms created using our service.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                3. How We Use Your Data
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-[15px] leading-relaxed text-ink-600">
                <li>To provide and maintain our service.</li>
                <li>To notify you about changes to our service.</li>
                <li>
                  To allow you to participate in interactive features of our
                  service when you choose to do so.
                </li>
                <li>To provide customer support.</li>
                <li>
                  To gather analysis or valuable information so that we can
                  improve our service.
                </li>
                <li>To monitor the usage of our service.</li>
                <li>To detect, prevent and address technical issues.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                4. Data Security
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                We have put in place appropriate security measures to prevent
                your personal data from being accidentally lost, used or
                accessed in an unauthorized way, altered or disclosed. In
                addition, we limit access to your personal data to those
                employees, agents, contractors and other third parties who have
                a business need to know.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                5. Data Retention
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                We will only retain your personal data for as long as necessary
                to fulfill the purposes we collected it for, including for the
                purposes of satisfying any legal, accounting, or reporting
                requirements.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                6. Your Legal Rights
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                Under certain circumstances, you have rights under data
                protection laws in relation to your personal data, including the
                right to request access, correction, erasure, restriction,
                transfer, to object to processing, to portability of data and
                (where the lawful ground of processing is consent) to withdraw
                consent.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                7. Analytics
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                We use PostHog to understand how FormDrop is used: which pages
                are visited, which calls to action are clicked, and how many
                people who begin a signup finish it. Autocapture is switched
                off, so only the events we have explicitly defined are
                collected.
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                The contents of your form submissions, recipient email addresses
                and IP addresses are never sent as analytics properties.
                Analytics requests are routed through formdrop.co rather than
                directly to PostHog. Once you are signed in, events are
                associated with your account identifier only, not with your name
                or email address.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                8. Contact Us
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
                If you have any questions about this privacy policy or our
                privacy practices, please contact us at:
              </p>
              <p className="font-medium text-ink-800">support@formdrop.co</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
