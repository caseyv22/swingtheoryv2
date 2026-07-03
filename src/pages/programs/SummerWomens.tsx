import ProgramDetail from "./ProgramDetail";
import { findProgram } from "@/data/programs";

export default function SummerWomens() {
  const program = findProgram("summer-womens")!;
  return <ProgramDetail program={program} />;
}
