// This route was renamed to /league.
// Public /programs/league-night → /league via public/_redirects (301).
// This component is a fallback for direct SPA navigation.
import { Navigate } from "react-router-dom";
export default function LeagueNight() {
  return <Navigate to="/league" replace />;
}
