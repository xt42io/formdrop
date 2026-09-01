import { createFileRoute } from "@tanstack/react-router";

import { CodeTabs } from "@/components/docs/code-tabs";

export const Route = createFileRoute("/docs/getting-started")({
  component: GettingStarted,
});

function GettingStarted() {
  return (
    <div className="max-w-3xl pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Getting Started
        </h1>
        <p className="text-xl text-gray-600">
          Start collecting form submissions in minutes using our API.
        </p>
      </div>

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mt-10 mb-4">1. Create a Form</h2>
        <p>
          Log in to your dashboard and create a new form. You'll get a unique{" "}
          <strong>Form URL</strong> (e.g.,{" "}
          <code>https://api.formdrop.co/f/your-form-slug</code>) that you'll use
          to send submissions.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">2. Send a Submission</h2>
        <p>
          You can submit data using a standard HTML form or send an API request
          to your Form URL.
        </p>

        <CodeTabs
          tabs={[
            {
              title: "HTML Form",
              value: "html",
              language: "html",
              code: `<form action="https://api.formdrop.co/f/YOUR_FORM_SLUG" method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>`,
            },
            {
              title: "JavaScript",
              value: "javascript",
              language: "javascript",
              code: `const submitForm = async (data) => {
  const response = await fetch('https://api.formdrop.co/f/YOUR_FORM_SLUG', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: "user@example.com",
      message: "Hello world"
    })
  });

  const result = await response.json();
  console.log(result);
};`,
            },
            {
              title: "PHP",
              value: "php",
              language: "php",
              code: `<?php
$url = 'https://api.formdrop.co/f/YOUR_FORM_SLUG';
$data = [
    'email' => 'user@example.com',
    'message' => 'Hello world'
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
if ($result === FALSE) { /* Handle error */ }

var_dump($result);
?>`,
            },
            {
              title: "cURL",
              value: "curl",
              language: "bash",
              code: `curl -X POST https://api.formdrop.co/f/YOUR_FORM_SLUG \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "message": "Hello world"
  }'`,
            },
          ]}
        />

        <h2 className="text-2xl font-bold mt-10 mb-4">
          3. Check your Dashboard
        </h2>
        <p>
          Go to the <strong>Forms</strong> section in your dashboard to view the
          submission. You can also configure email, Slack, or Discord
          notifications for this form.
        </p>
      </div>
    </div>
  );
}
