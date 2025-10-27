interface EmptySearchResultsProps {
  onClear?: () => void;
  onBrowseAll?: () => void;
}

export default function EmptySearchResults({ onClear, onBrowseAll }: EmptySearchResultsProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
      <p className="text-gray-600 mb-6">Try adjusting your search filters.</p>
      <div className="flex gap-4 justify-center">
        {onClear && (
          <button onClick={onClear} className="btn-outline">
            Clear Filters
          </button>
        )}
        {onBrowseAll && (
          <button onClick={onBrowseAll} className="btn-primary">
            Browse All
          </button>
        )}
      </div>
    </div>
  );
}
