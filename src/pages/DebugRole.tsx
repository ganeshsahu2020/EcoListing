import { useAuth } from "../contexts/AuthContext";
export default function DebugRole() {
  const { user, role, loading } = useAuth();
  return <pre className="p-4">{JSON.stringify({ loading, uid:user?.id, email:user?.email, role }, null, 2)}</pre>;
}
