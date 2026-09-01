import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "../components/landing/navbar";
import { Footer } from "../components/landing/footer";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="grow pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-600 mb-4">
                Welcome to FormDrop ("we," "our," or "us"). We respect your
                privacy and are committed to protecting your personal data. This
                privacy policy will inform you as to how we look after your
                personal data when you visit our website and use our services,
                and tell you about your privacy rights and how the law protects
                you.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Data We Collect
              </h2>
              <p className="text-gray-600 mb-4">
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How We Use Your Data
              </h2>
              <p className="text-gray-600 mb-4">
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-600 mb-4">
                We have put in place appropriate security measures to prevent
                your personal data from being accidentally lost, used or
                accessed in an unauthorized way, altered or disclosed. In
                addition, we limit access to your personal data to those
                employees, agents, contractors and other third parties who have
                a business need to know.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Retention
              </h2>
              <p className="text-gray-600 mb-4">
                We will only retain your personal data for as long as necessary
                to fulfill the purposes we collected it for, including for the
                purposes of satisfying any legal, accounting, or reporting
                requirements.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Your Legal Rights
              </h2>
              <p className="text-gray-600 mb-4">
                Under certain circumstances, you have rights under data
                protection laws in relation to your personal data, including the
                right to request access, correction, erasure, restriction,
                transfer, to object to processing, to portability of data and
                (where the lawful ground of processing is consent) to withdraw
                consent.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact Us
              </h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this privacy policy or our
                privacy practices, please contact us at:
              </p>
              <p className="text-gray-600 font-medium">support@formdrop.co</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
