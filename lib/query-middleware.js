const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
  logDebugSafe,
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
      this.xRaySubsegment = exports.createQuerySubsegment(
        operation,
        this,
        options
      );
      next();
    });

    schema.post(operation, function (result, next) {
      closeCurrentSegment(this.xRaySubsegment);
      next();
    });

    schema.post(operation, function (err, result, next) {
      handleSegmentError(err, this.xRaySubsegment);
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
    const subsegment = parent.addNewSubsegment(
      `${query.model.modelName}-${operation}`
    );
    subsegment.addAnnotation('model', query.model.modelName);
    subsegment.addMetadata('operation', operation);
    if (options && options.verbose) {
      subsegment.addMetadata(
        'filter',
        query.getFilter() || (query.getQuery && query.getQuery())
      );
      subsegment.addMetadata('update', query.getUpdate());
      subsegment.addMetadata('options', query.getOptions());
      subsegment.addMetadata('populatedPaths', query.getPopulatedPaths());
    }
    logDebugSafe(
      `Mongoose-XRay: Opened Subsegment: ${subsegment.id} Parent Segment: ${parent.id}`
    );
    return subsegment;
  }
};
