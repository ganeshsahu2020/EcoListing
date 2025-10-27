import EmptySaved from "../components/states/EmptySaved";
import { useNavigate } from "react-router-dom";

export default function Saved() {
  const nav = useNavigate();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <EmptySaved onStart={() => nav("/map")} />
    </main>
  );
}
