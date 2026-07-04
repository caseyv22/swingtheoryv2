import ProgramDetail from "./ProgramDetail";
import { useProgram } from "@/hooks/usePrograms";

export default function SummerSeniors() {
  const { program } = useProgram("summer-seniors");
  return <ProgramDetail program={program!} />;
}
