// Simple UUID v4 generator (RFC4122 compliant)
export function generateUUID() {
  // https://stackoverflow.com/a/2117523/6465432
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
