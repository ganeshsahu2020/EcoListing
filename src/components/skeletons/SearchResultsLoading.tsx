interface SearchResultsLoadingProps {
  count?: number;
}

export default function SearchResultsLoading({ count = 6 }: SearchResultsLoadingProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse p-6">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded mt-2" />
          <div className="skeleton h-4 w-2/3 rounded mt-1" />
        </div>
      ))}
    </div>
  );
}
