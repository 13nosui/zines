import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type");
  const returnTo = requestUrl.searchParams.get("returnTo") || "/";

  // Get locale from pathname
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(\w{2})\//);
  const locale = localeMatch ? localeMatch[1] : "en";

  // Handle OAuth errors - redirect to callback page with error
  if (error) {
    console.error("OAuth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/${locale}/auth/callback?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (code) {
    const supabase = createServerClient();

    try {
      // Exchange code for session
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${
            requestUrl.origin
          }/${locale}/auth/callback?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }

      // Successful authentication - redirect to callback page
      if (data?.session) {
        // Check if this is a password recovery flow
        if (type === "recovery") {
          return NextResponse.redirect(
            `${requestUrl.origin}/${locale}/auth/reset-password`
          );
        }

        // Redirect to the callback page which will handle session polling
        return NextResponse.redirect(
          `${
            requestUrl.origin
          }/${locale}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
        );
      }
    } catch (err) {
      console.error("Callback processing error:", err);
      return NextResponse.redirect(
        `${
          requestUrl.origin
        }/${locale}/auth/callback?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  // No code present, redirect to callback page with error
  return NextResponse.redirect(
    `${requestUrl.origin}/${locale}/auth/callback?error=${encodeURIComponent(
      "No authorization code received"
    )}`
  );
}
