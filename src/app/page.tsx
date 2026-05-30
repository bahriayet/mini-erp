import { redirect } from "next/navigation"

/**
 * Root page acts as an entrypoint and redirects users straight to the dashboard.
 * NextAuth middleware will intercept this request and redirect them to /login if they aren't authenticated.
 */
export default function RootPage() {
  redirect("/dashboard")
}
