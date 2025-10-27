interface MapLoadingProps {
  text?: string;
}

export default function MapLoading({ text = "Loading map..." }: MapLoadingProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">{text}</p>
      </div>
    </div>
  );
}
