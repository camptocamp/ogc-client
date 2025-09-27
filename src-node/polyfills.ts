// mock the window.location object
if (!('location' in globalThis)) {
  // @ts-expect-error - location is not available on server side
  globalThis.location = new URL('http://localhost');
}
