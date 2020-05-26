const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
} = require('./segment-helpers');

const queryOperations = [
  'count',
  'countDocuments',
  'deleteOne',
  'deleteMany',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndUpdate',
  'update',
  'updateOne',
  'updateMany',
];

/**
 * Registers query middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.registerQueryMiddleware = (schema, options) => {
  queryOperations.forEach((operation) => {
    schema.pre(operation, function (next) {
      exports.createQuerySubsegment(operation, this, options);
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
  });
};

/**
 * Creates the subsegment for query middleware
 * @param operation {String} The operation that is to occur (findOne, update, etc...)
 * @param query {Object} The mongoose query
 * @param [options] {MongooseXRayOptions} Options for XRay recording
 */
exports.createQuerySubsegment = (operation, query, options) => {
  const parent = AWSXRay.getSegment();
  if (parent) {
    const subsegment = parent.addNewSubsegment(query.model.modelName);
    subsegment.addMetadata('operation', operation);
    subsegment.addMetadata('filter', query.getFilter());
    if (options && options.verbose) {
      subsegment.addMetadata('update', query.getUpdate());
      subsegment.addMetadata('options', query.getOptions());
      subsegment.addMetadata('populatedPaths', query.getPopulatedPaths());
    }
  }
};
