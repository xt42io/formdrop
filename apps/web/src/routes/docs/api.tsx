import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "@/components/docs/code-block";

export const Route = createFileRoute("/docs/api")({
  component: ApiDocs,
});

function ApiDocs() {
  return (
    <div className="max-w-4xl pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          API Reference
        </h1>
        <p className="text-xl text-gray-600">
          Programmatic access to FormDrop features.
        </p>
      </div>

      <div className="prose prose-gray max-w-none">
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Authentication</h2>
          <p className="mb-4">
            FormDrop uses API keys for authentication to the Management API. You
            can find your API keys in the dashboard settings.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">Important:</span> Keep your
                  Private API Key secret. It allows full access to your forms
                  and submissions. Never expose this in client-side code.
                </p>
              </div>
            </div>
          </div>
          <p className="mb-4">
            Authenticate your requests by including your API key in the{" "}
            <code>Authorization</code> header:
          </p>
          <CodeBlock
            code={`Authorization: Bearer YOUR_PRIVATE_KEY`}
            language="http"
          />
        </section>

        <div className="space-y-12">
          {/* Submit Form */}
          <section id="submit-form">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-lg">
                POST
              </span>
              <h2 className="text-2xl font-bold">Submit Form</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Send a new form submission. This endpoint is public and should be
              used from your frontend code.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h3 className="font-semibold mb-4">Endpoint</h3>
              <code className="text-accent">
                https://api.formdrop.co/f/:formSlug
              </code>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h3 className="font-semibold mb-4">Request Body</h3>
              <p className="text-gray-600 mb-4">
                A JSON object containing your form fields.
              </p>
            </div>

            <CodeBlock
              code={`// Example using fetch
fetch('https://api.formdrop.co/f/my-form-slug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: "user@example.com",
    message: "Hello world"
  })
})`}
              language="javascript"
            />
          </section>

          {/* List Forms */}
          <section id="list-forms">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-lg">
                GET
              </span>
              <h2 className="text-2xl font-bold">List Forms</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Retrieve a list of all your forms. Requires a private API key.
            </p>
            <CodeBlock
              code={`curl https://api.formdrop.co/forms \\
  -H "Authorization: Bearer YOUR_PRIVATE_KEY"`}
              language="bash"
            />
          </section>

          {/* Get Submissions */}
          <section id="get-submissions">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-lg">
                GET
              </span>
              <h2 className="text-2xl font-bold">Get Submissions</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Retrieve submissions for a specific form. Requires a private API
              key.
            </p>
            <CodeBlock
              code={`curl https://api.formdrop.co/:formSlug/submissions \\
  -H "Authorization: Bearer YOUR_PRIVATE_KEY"`}
              language="bash"
            />
          </section>

          {/* Delete Form */}
          <section id="delete-form">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-red-700 bg-red-100 rounded-lg">
                DELETE
              </span>
              <h2 className="text-2xl font-bold">Delete Form</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Soft-delete a form and hide it from the dashboard and API. Use the
              form&apos;s id (not slug). Requires your API key.
            </p>
            <CodeBlock
              code={`curl -X DELETE https://api.formdrop.co/forms/:formId \\
  -H "Authorization: Bearer YOUR_PRIVATE_KEY"`}
              language="bash"
            />
          </section>

          {/* Delete Submission */}
          <section id="delete-submission">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-red-700 bg-red-100 rounded-lg">
                DELETE
              </span>
              <h2 className="text-2xl font-bold">Delete Submission</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Soft-delete a submission by id. It will no longer appear in list
              endpoints. Requires your API key.
            </p>
            <CodeBlock
              code={`curl -X DELETE https://api.formdrop.co/:formId/submissions/:submissionId \\
  -H "Authorization: Bearer YOUR_PRIVATE_KEY"`}
              language="bash"
            />
          </section>

          {/* Bulk delete submissions */}
          <section id="delete-submissions-bulk">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-bold text-red-700 bg-red-100 rounded-lg">
                DELETE
              </span>
              <h2 className="text-2xl font-bold">Delete Submissions (bulk)</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Soft-delete multiple submissions. Request body must be JSON with{" "}
              <code>submissionIds</code> (array of ids). All ids must belong to
              the form.
            </p>
            <CodeBlock
              code={`curl -X DELETE https://api.formdrop.co/:formId/submissions \\
  -H "Authorization: Bearer YOUR_PRIVATE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"submissionIds":["uuid-one","uuid-two"]}'`}
              language="bash"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
