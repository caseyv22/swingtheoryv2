import ProgramDetail from "./ProgramDetail";
import { findProgram } from "@/data/programs";

export default function LeagueNight() {
  const program = findProgram("league-night")!;
  return <ProgramDetail program={program} useLeagueForm />;
}
