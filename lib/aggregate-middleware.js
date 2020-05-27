const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
} = require('./segment-helpers');

const operation = 'aggregate';

/**
 * Registers aggregate middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.registerAggregateMiddleware = (schema, options) => {
  schema.pre(operation, function (next) {
    const subsegment = exports.createAggregateSubsegment(
      operation,
      this,
      options
    );
    if (subsegment) {
      this.xRaySubsegmentId = subsegment.id;
    }
    next();
  });

  schema.post(operation, function (docs, next) {
    closeCurrentSegment(this.xRaySubsegmentId);
    next();
  });

  schema.post(operation, function (err, docs, next) {
    handleSegmentError(err, this.xRaySubsegmentId);
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
    const subsegment = parent.addNewSubsegment(
      `${aggregate.model().modelName}-${operation}`
    );
    subsegment.addAnnotation('model', aggregate.model().modelName);
    subsegment.addAnnotation('operation', operation);
    if (options && options.verbose) {
      subsegment.addMetadata('options', aggregate.options);
      subsegment.addMetadata('aggregate', JSON.stringify(aggregate));
    }
    return subsegment;
  }
};
