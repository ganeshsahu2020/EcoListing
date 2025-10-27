declare module "maplibre-gl/dist/maplibre-gl-csp-worker?worker" {
  const WorkerCtor: { new (): Worker };
  export default WorkerCtor;
}
