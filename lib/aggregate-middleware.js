const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
  logDebugSafe,
} = require('./segment-helpers');

const operation = 'aggregate';

/**
 * Registers aggregate middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.registerAggregateMiddleware = (schema, options) => {
  schema.pre(operation, function (next) {
    this.xRaySubsegment = exports.createAggregateSubsegment(
      operation,
      this,
      options
    );
    next();
  });

  schema.post(operation, function (docs, next) {
    closeCurrentSegment(this.xRaySubsegment);
    next();
  });

  schema.post(operation, function (err, docs, next) {
    handleSegmentError(err, this.xRaySubsegment);
    next();
  });
};

/**
 * Creates the subsegment for query middleware
 * @param operation {String} The operation that is to occur (findOne, update, etc...)
 * @param aggregate {Object} The aggregate related to the operation
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.createAggregateSubsegment = (operation, aggregate, options) => {
  const parent = AWSXRay.getSegment();
  if (parent) {
    const subsegment = parent.addNewSubsegment('mongodb.aggregate');
    subsegment.addAnnotation(`${aggregate.model().modelName}-${operation}`, 'aggregate');
    subsegment.addAnnotation('model', aggregate.model().modelName);
    subsegment.addMetadata('operation', operation);
    subsegment.namespace = 'remote';
    if (options && options.verbose) {
      subsegment.addMetadata('options', aggregate.options);
      subsegment.addMetadata('aggregate', JSON.stringify(aggregate));
    }
    logDebugSafe(
      `Mongoose-XRay: Opened Subsegment: ${subsegment.id} Parent Segment: ${parent.id}`
    );
    return subsegment;
  }
};
