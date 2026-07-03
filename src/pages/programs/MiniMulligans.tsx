import ProgramDetail from "./ProgramDetail";
import { findProgram } from "@/data/programs";

export default function MiniMulligans() {
  const program = findProgram("mini-mulligans")!;
  return <ProgramDetail program={program} />;
}
