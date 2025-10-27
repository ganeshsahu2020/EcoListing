export function readHashParams(): Record<string,string> {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const obj: Record<string,string> = {};
  params.forEach((v,k)=>{ obj[k]=v; });
  return obj;
}
