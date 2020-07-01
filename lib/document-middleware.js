const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
  logDebugSafe,
} = require('./segment-helpers');

const documentOperations = ['save', 'remove'];

/**
 * Registers document middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.registerDocumentMiddleware = (schema, options) => {
  documentOperations.forEach((operation) => {
    schema.pre(operation, function (next) {
      this.xRaySubsegment = exports.createDocumentSubsegment(
        operation,
        this,
        options
      );
      next();
    });

    schema.post(operation, function (doc, next) {
      closeCurrentSegment(this.xRaySubsegment);
      next();
    });

    schema.post(operation, function (err, doc, next) {
      handleSegmentError(err, this.xRaySubsegment);
      next();
    });
  });
};

/**
 * Creates the subsegment for query middleware
 * @param operation {String} The operation that is to occur (findOne, update, etc...)
 * @param document {Object} The document related to the operation
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.createDocumentSubsegment = (operation, document, options) => {
  const parent = AWSXRay.getSegment();
  if (parent) {
    const modelName =
      document.constructor.modelName ||
      `${document.constructor.name}-${document.constructor.path}`;
    const subsegment = parent.addNewSubsegment('mongodb.document');
    subsegment.addAnnotation(`${modelName}-${operation}`, 'document');
    subsegment.addAnnotation('model', modelName);
    subsegment.addMetadata('operation', operation);
    subsegment.namespace = 'remote';
    if (options && options.verbose) {
      subsegment.addMetadata('document', JSON.stringify(document));
    }
    logDebugSafe(
      `Mongoose-XRay: Opened Subsegment: ${subsegment.id} Parent Segment: ${parent.id}`
    );
    return subsegment;
  }
};
