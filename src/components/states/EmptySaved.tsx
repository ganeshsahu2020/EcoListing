interface EmptySavedProps {
  onStart?: () => void;
}

export default function EmptySaved({ onStart }: EmptySavedProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">💔</div>
      <h3 className="text-lg font-semibold mb-2">No Saved Properties</h3>
      <p className="text-gray-600 mb-6">Start browsing and save your favorites!</p>
      {onStart && (
        <button onClick={onStart} className="btn-primary">
          Start Browsing
        </button>
      )}
    </div>
  );
}
