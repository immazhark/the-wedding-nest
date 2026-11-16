/** Count cached payloads too; transferSize is zero for many browser-cache hits. */
export function accountedResourceBytes(resource: {
  transferSize: number;
  encodedBodySize: number;
}): number {
  return Math.max(resource.transferSize, resource.encodedBodySize);
}
