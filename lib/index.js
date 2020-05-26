const { registerQueryMiddleware } = require('./query-middleware');
const { registerDocumentMiddleware } = require('./document-middleware');
const { registerAggregateMiddleware } = require('./aggregate-middleware');
const { registerModelMiddleware } = require('./model-middleware');

/**
 * Register the AWS XRay plugin with mongoose
 * @param {Object} schema Schema to apply Mongoose options to
 * @param {MongooseXRayOptions} [options] Mongoose XRay options
 */
module.exports = function xRayPlugin(schema, options) {
  registerQueryMiddleware(schema, options);
  registerDocumentMiddleware(schema, options);
  registerAggregateMiddleware(schema, options);
  registerModelMiddleware(schema);
};
