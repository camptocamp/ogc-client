import { WfsEndpoint } from '../dist/dist-node.js';

function test() {
  console.log('TEST 1');
  console.log('===');
  const endpoint = new WfsEndpoint('https://data.geopf.fr/not-a-wfs');
  endpoint
    .isReady()
    .then((result) => console.log('success 1 => ', result))
    .catch((error) => console.error('error 1 => ', error));
}

async function test2() {
  console.log('TEST 2');
  console.log('===');
  const endpoint = new WfsEndpoint('https://data.geopf.fr/wfs');
  try {
    const result = await endpoint.isReady();
    console.log('success 2 => ', result);
  } catch (e) {
    console.error('error 2 => ', e);
  }
}

test();
test2();
