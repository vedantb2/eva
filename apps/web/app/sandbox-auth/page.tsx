import { SandboxAuthClient } from "./SandboxAuthClient";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// async function generateClerkSignInToken(
//   clerkSecretKey: string,
//   userId: string,
// ): Promise<string> {
//   const response = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${clerkSecretKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ user_id: userId }),
//     cache: "no-store",
//   });

//   const responseBody = await response.text();
//   if (!response.ok) {
//     throw new Error(
//       `Failed to create Clerk sign-in token (${response.status}): ${responseBody}`,
//     );
//   }

//   let parsed: unknown;
//   try {
//     parsed = JSON.parse(responseBody);
//   } catch {
//     throw new Error("Clerk sign-in token response was not valid JSON");
//   }

//   if (typeof parsed !== "object" || parsed === null) {
//     throw new Error("Clerk sign-in token response was not an object");
//   }

//   const token = Reflect.get(parsed, "token");
//   if (typeof token !== "string" || token.length === 0) {
//     throw new Error("Clerk sign-in token response did not include a token");
//   }

//   return token;
// }

export default async function SandboxAuthPage() {
  // const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  // const sandboxClerkUserId = process.env.SANDBOX_CLERK_USER_ID;

  // let ticket: string | null = null;

  // if (clerkSecretKey && sandboxClerkUserId) {
  //   try {
  //     ticket = await generateClerkSignInToken(
  //       clerkSecretKey,
  //       sandboxClerkUserId,
  //     );
  //   } catch (error) {
  //     console.error("Failed to prepare sandbox Clerk ticket:", error);
  //   }
  // }

  return null;

  // return <SandboxAuthClient ticket={ticket} />;
}
