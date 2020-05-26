const Hapi = require('hapi');

const debug = require('debug')('hapi-xray');

const server = Hapi.server({
  host: 'localhost',
  port: 9000
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

server.route({
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    const segment = request.segment;
    segment.addAnnotation('hitController', 'true');

    await sleep(10000);

    return { hello: 'world' };
  }
});

const start = async () => {
  try {
    await server.register({
      plugin: require('../'),
      options: {
        captureAWS: false
      }
    });
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log('Server running at:', server.info.uri);
};

start();
