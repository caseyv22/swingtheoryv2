import ProgramDetail from "./ProgramDetail";
import { useProgram } from "@/hooks/usePrograms";

export default function MiniMulligans() {
  const { program } = useProgram("mini-mulligans");
  return <ProgramDetail program={program!} />;
}
