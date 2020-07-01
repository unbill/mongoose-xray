const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
  logDebugSafe,
} = require('./segment-helpers');

const operation = 'insertMany';

/**
 * Registers model middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 */
exports.registerModelMiddleware = (schema) => {
  schema.pre(operation, function (next) {
    const subsegment = exports.createModelSubsegment(operation, this);
    if (subsegment) {
      if (!this.xRaySubsegments) {
        this.xRaySubsegments = [];
      }
      this.xRaySubsegments.unshift(subsegment);
    }
    next();
  });

  schema.post(operation, function (result, next) {
    if (this.xRaySubsegments && this.xRaySubsegments.length) {
      closeCurrentSegment(this.xRaySubsegments.pop());
    }
    next();
  });

  schema.post(operation, function (err, result, next) {
    if (this.xRaySubsegments && this.xRaySubsegments.length) {
      handleSegmentError(err, this.xRaySubsegments.pop());
    }
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
    const subsegment = parent.addNewSubsegment(
      'mongodb.model'
    );
    subsegment.addAnnotation(`${model.modelName}-${operation}`, 'model');
    subsegment.addAnnotation('model', model.modelName);
    subsegment.addMetadata('operation', operation);
    subsegment.namespace = 'remote';
    logDebugSafe(
      `Mongoose-XRay: Opened Subsegment: ${subsegment.id} Parent Segment: ${parent.id}`
    );
    return subsegment;
  }
};
