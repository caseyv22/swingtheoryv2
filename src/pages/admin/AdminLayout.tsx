import { NavLink, Outlet, Link } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { Helmet } from "react-helmet-async";

// The admin layout renders behind Cloudflare Access. Access blocks
// unauthenticated requests before they ever reach the app, so this
// layout only shows once the user is signed in via magic link email.
export default function AdminLayout() {
  const { data, loading, error } = useApi<{ user: { email: string } }>("/api/admin/me");

  return (
    <>
      <Helmet>
        <title>Admin, Swing Theory</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-cream text-ink flex">
        <aside className="w-64 bg-green-900 text-white flex flex-col">
          <Link to="/" className="p-6 border-b border-white/10">
            <div className="font-disp text-lg text-white">Swing Theory</div>
            <div className="font-disp text-[11px] tracking-[0.18em] uppercase text-gold mt-1">
              Admin
            </div>
          </Link>
          <nav className="flex-1 p-4 space-y-1">
            <SideLink to="/admin" label="Dashboard" end />
            <SideLink to="/admin/analytics" label="Analytics" />
            <SideLink to="/admin/league" label="League" />
            <SideLink to="/admin/programs" label="Programs" />
            <SideLink to="/admin/coaches" label="Lessons / Coaches" />
            <SideLink to="/admin/mm-waitlist" label="MM Waitlist" />
            <SideLink to="/admin/submissions" label="Submissions" />
          </nav>
          <div className="p-4 border-t border-white/10 text-[13px] text-white/60">
            {loading && "Checking access…"}
            {error && <span className="text-red-300">Access error</span>}
            {data?.user && (
              <>
                <div className="text-white/80 font-disp text-xs uppercase tracking-[0.12em]">
                  Signed in
                </div>
                <div className="text-white truncate">{data.user.email}</div>
                <a
                  href="/cdn-cgi/access/logout"
                  className="mt-2 inline-block text-gold hover:underline text-[12px]"
                >
                  Sign out
                </a>
              </>
            )}
          </div>
        </aside>
        <main className="flex-1 p-10 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function SideLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg font-disp text-[14px] transition ${
          isActive
            ? "bg-gold text-[#241c05]"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
