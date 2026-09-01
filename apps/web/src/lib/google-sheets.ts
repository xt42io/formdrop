export async function refreshGoogleSheetsToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `Failed to refresh token: ${data.error_description || data.error}`,
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in, // seconds
  };
}
