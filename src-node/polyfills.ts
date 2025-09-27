// mock the window.location object
if (!('location' in global)) {
  // @ts-expect-error - location is not available on server side
  global.location = new URL('http://localhost');
}
