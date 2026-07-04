import { useParams } from "react-router-dom";
import ProgramDetail from "./ProgramDetail";
import NotFound from "@/pages/NotFound";
import { useProgram } from "@/hooks/usePrograms";

// Catch-all for programs added purely through /admin/programs that don't
// have their own hardcoded route (mini-mulligans, summer-womens, and
// summer-seniors keep dedicated components so their URLs never change;
// anything new created in admin lands here automatically).
export default function ProgramBySlug() {
  const { slug = "" } = useParams();
  const { program, loading } = useProgram(slug);

  if (!program && loading) return null;
  if (!program) return <NotFound />;

  return <ProgramDetail program={program} useLeagueForm={program.useLeagueForm} />;
}
