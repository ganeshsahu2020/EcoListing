import { Loader } from "@googlemaps/js-api-loader";

let loader: Loader | null = null;

export function getGoogleLoader() {
  if (!loader) {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (!key) {
      // Surface a clear error in dev if the key is missing.
      console.warn("Missing VITE_GOOGLE_MAPS_API_KEY env var");
    }
    loader = new Loader({
      apiKey: key || "",
      version: "weekly",
      libraries: ["places"],
    });
  }
  return loader!;
}
