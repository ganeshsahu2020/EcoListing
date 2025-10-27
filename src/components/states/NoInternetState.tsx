interface NoInternetStateProps {
  onRetry?: () => void;
}

export default function NoInternetState({ onRetry }: NoInternetStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📶</div>
      <h3 className="text-lg font-semibold mb-2">No Internet Connection</h3>
      <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn-primary"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
