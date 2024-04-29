export function isMimeTypeJson(mimeType: string): boolean {
  return mimeType.toLowerCase().indexOf('json') > -1;
}

export function isMimeTypeGeoJson(mimeType: string): boolean {
  return /geo.?json/.test(mimeType);
}

export function isMimeTypeJsonFg(mimeType: string): boolean {
  return /json.?fg|fg.?json/.test(mimeType);
}
