const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
} = require('./segment-helpers');

const operation = 'insertMany';

/**
 * Registers model middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 */
exports.registerModelMiddleware = (schema) => {
  schema.pre(operation, function (next) {
    exports.createModelSubsegment(operation, this);
    next();
  });

  schema.post(operation, function (result, next) {
    closeCurrentSegment();
    next();
  });

  schema.post(operation, function (err, result, next) {
    handleSegmentError(err);
    next();
  });
};

/**
 * Creates the subsegment for query middleware
 * @param operation {String} The operation that is to occur (findOne, update, etc...)
 * @param model {Object} The model related to the operation
 */
exports.createModelSubsegment = (operation, model) => {
  const parent = AWSXRay.getSegment();
  if (parent) {
    const subsegment = parent.addNewSubsegment(model.modelName);
    subsegment.addMetadata('operation', operation);
  }
};
