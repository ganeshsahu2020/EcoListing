// ui/src/pages/RouterProbe.tsx
import { useParams, Link } from "react-router-dom";

export default function RouterProbe() {
  const p = useParams();            // <-- will throw if not in Router
  return (
    <div className="p-4">
      <div>Params: {JSON.stringify(p)}</div>
      <Link to="/">home</Link>
    </div>
  );
}
