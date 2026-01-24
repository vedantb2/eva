import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    const signInUrl = new URL(
      "/sign-in",
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "http://localhost:3000"
    );
    signInUrl.searchParams.set(
      "redirect_url",
      "/api/extension/auth"
    );
    return NextResponse.redirect(signInUrl);
  }

  const user = await currentUser();

  const token = userId;
  const extensionId = process.env.EXTENSION_ID || "";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Eva - Authentication</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background: #0f172a;
        color: white;
      }
      .container {
        text-align: center;
        padding: 2rem;
      }
      .success {
        color: #22c55e;
        font-size: 48px;
        margin-bottom: 1rem;
      }
      h1 {
        margin-bottom: 0.5rem;
      }
      p {
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="success">✓</div>
      <h1>Authentication Successful</h1>
      <p>You can close this window and return to the extension.</p>
    </div>
    <script>
      const authData = {
        type: 'CONDUCTOR_AUTH_SUCCESS',
        token: '${token}',
        user: {
          id: '${user?.id || ""}',
          email: '${user?.emailAddresses[0]?.emailAddress || ""}',
          name: '${user?.fullName || ""}'
        }
      };

      // Try to send to extension via externally_connectable
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        const extensionId = '${extensionId}';
        if (extensionId) {
          chrome.runtime.sendMessage(extensionId, authData, function(response) {
            if (response && response.success) {
              window.close();
            }
          });
        }
      }

      // Fallback: try postMessage to opener
      if (window.opener) {
        window.opener.postMessage(authData, '*');
        setTimeout(() => window.close(), 1000);
      }
    </script>
  </body>
</html>
`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
