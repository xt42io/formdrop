import { createFileRoute } from "@tanstack/react-router";
import { CodeTabs } from "@/components/docs/code-tabs";

export const Route = createFileRoute("/docs/forms")({
  component: FormsDocs,
});

function FormsDocs() {
  return (
    <div className="max-w-3xl pb-20">
      <div className="mb-10">
        <h1 className="mb-4 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-950">
          Forms
        </h1>
        <p className="text-[17px] leading-relaxed text-ink-600">
          Learn how to create, configure, and secure your forms.
        </p>
      </div>

      <div className="max-w-none">
        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          Creating a Form
        </h2>
        <p>
          You can create a form directly from the dashboard by clicking the
          <strong>Create Form</strong> button.
        </p>

        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          HTML Configuration
        </h2>
        <p>
          The simplest way to use FormDrop is with a standard HTML form. Set the
          <code>action</code> attribute to our endpoint URL with your form slug.
        </p>

        <CodeTabs
          tabs={[
            {
              title: "HTML",
              value: "html",
              language: "html",
              code: `<form action="https://api.formdrop.co/f/YOUR_FORM_SLUG" method="POST">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required />

  <label for="message">Message</label>
  <textarea id="message" name="message" required></textarea>

  <button type="submit">Send Message</button>
</form>`,
            },
            {
              title: "React",
              value: "react",
              language: "tsx",
              code: `export default function ContactForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await fetch('https://api.formdrop.co/f/YOUR_FORM_SLUG', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    
    alert('Message sent!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Send Message</button>
    </form>
  );
}`,
            },
          ]}
        />

        <div className="my-6 rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="text-sm leading-relaxed text-accent-800">
            <strong>Tip:</strong> Ensure all your input fields have a
            <code>name</code> attribute. This is how we identify the data fields
            in your submission.
          </p>
        </div>

        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          Managing Forms
        </h2>
        <p>
          Clicking on a form in the dashboard opens the form details view, where
          you can access several tabs:
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
          <li>
            <strong>Submissions:</strong> View and manage all data collected by
            your form.
          </li>
          <li>
            <strong>Analytics:</strong> Visualize submission trends over time.
          </li>
          <li>
            <strong>Notifications:</strong> Configure email alerts, Slack
            messages, and Discord notifications.
          </li>
          <li>
            <strong>Integrations:</strong> Connect with external tools like
            Google Sheets.
          </li>
          <li>
            <strong>Settings:</strong> Update form details, configure allowed
            domains, or delete the form.
          </li>
        </ul>

        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          Form Settings
        </h2>

        <h3 className="mt-8 mb-2 text-base font-semibold text-ink-950">
          Allowed Domains
        </h3>
        <p>
          Restrict which websites can submit to your form. You can add multiple
          domains to the allowlist (e.g., <code>example.com</code>,{" "}
          <code>app.example.com</code>). This is a crucial security feature to
          prevent spam from unauthorized sources.
        </p>

        <h3 className="mt-8 mb-2 text-base font-semibold text-ink-950">
          Danger Zone
        </h3>
        <p>
          You can permanently delete a form and all its associated data from the
          settings tab. This action cannot be undone.
        </p>
      </div>
    </div>
  );
}
