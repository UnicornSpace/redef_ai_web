import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  // Forwarded as a request header so Server Components downstream (layouts,
  // pages) can read the current pathname via headers() — there's no other
  // reliable way to get it outside a page's own params/searchParams.
  request.headers.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  // Supabase's own OAuth redirect can land the "?code=" exchange on the
  // wrong URL — e.g. if the exact redirectTo we requested isn't in the
  // project's Redirect URLs allowlist, Supabase silently falls back to the
  // Site URL and appends the code there instead of at /auth/callback.
  // Forward it to the real handler so sign-in still completes either way.
  // Gated on `!user`: a stray/stale "?code=" sitting in the URL (browser
  // history, a re-visited link) for someone who's ALREADY signed in must
  // never trigger this — the code was already consumed on a prior request,
  // so re-exchanging it just fails with an "invalid/expired" error for no
  // reason.
  if (
    !user &&
    pathname !== "/auth/callback" &&
    request.nextUrl.searchParams.has("code")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Everything under the marketing site — (public) route group, the
  // homepage, /auth/*, /login — is meant to stay reachable without a
  // session. Rather than trying to enumerate every public path (easy to
  // miss one and accidentally 401 a real marketing page), we whitelist the
  // small set of prefixes that DO require auth and default everything else
  // to public.
  const PROTECTED_PREFIXES = ["/app", "/onboarding"];
  // Habit invite links must stay crawlable without a session — chat apps
  // fetch this URL (and its opengraph-image sibling) to build a link
  // preview. The page itself still gates the actual "accept" action on
  // being signed in (see src/app/app/habits/join/[id]/page.tsx). Mirrors
  // the equivalent exemption in src/app/app/layout.tsx.
  const isPublicInvite = /^\/app\/habits\/join\//.test(pathname);
  const isProtected =
    !isPublicInvite &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (!user && isProtected) {
    // no user — redirect to login, carrying the original path (+ query) so
    // the login form can bounce them back afterwards. This is what makes
    // shared links (invite-a-friend, challenge join, referrals) survive
    // an interruption for sign-up/sign-in.
    const url = request.nextUrl.clone();
    const returnTo = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/auth/login";
    url.search = "";
    if (returnTo && returnTo !== "/") {
      url.searchParams.set("redirect", returnTo);
    }
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
