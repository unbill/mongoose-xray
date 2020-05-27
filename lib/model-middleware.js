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
    const subsegment = exports.createModelSubsegment(operation, this);
    if (subsegment) {
      if (!this.xRaySubsegmentIds) {
        this.xRaySubsegmentIds = [];
      }
      this.xRaySubsegmentIds.unshift(subsegment.id);
    }
    next();
  });

  schema.post(operation, function (result, next) {
    if (this.xRaySubsegmentIds && this.xRaySubsegmentIds.length) {
      closeCurrentSegment(this.xRaySubsegmentIds.pop());
    }
    next();
  });

  schema.post(operation, function (err, result, next) {
    if (this.xRaySubsegmentIds && this.xRaySubsegmentIds.length) {
      handleSegmentError(err, this.xRaySubsegmentIds.pop());
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
      `${model.modelName}-${operation}`
    );
    subsegment.addAnnotation('model', model.modelName);
    subsegment.addAnnotation('operation', operation);

    return subsegment;
  }
};
