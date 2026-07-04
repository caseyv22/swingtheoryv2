import ProgramDetail from "./ProgramDetail";
import { useProgram } from "@/hooks/usePrograms";

export default function SummerWomens() {
  const { program } = useProgram("summer-womens");
  return <ProgramDetail program={program!} />;
}
