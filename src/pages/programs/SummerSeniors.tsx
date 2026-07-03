import ProgramDetail from "./ProgramDetail";
import { findProgram } from "@/data/programs";

export default function SummerSeniors() {
  const program = findProgram("summer-seniors")!;
  return <ProgramDetail program={program} />;
}
