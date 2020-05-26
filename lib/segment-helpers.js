const AWSXRay = require('aws-xray-sdk-core');

/**
 * Closes the current xray segment
 */
exports.closeCurrentSegment = () => {
  const segment = AWSXRay.getSegment();
  if (segment && !segment.isClosed()) {
    segment.close();
  }
};

/**
 * Handles the error by closing the current xray segment with error information
 * @param {Error} err The error
 */
exports.handleSegmentError = (err) => {
  const segment = AWSXRay.getSegment();
  if (segment) {
    if (segment.isClosed()) {
      segment.addError(err);
    } else {
      segment.close(err);
    }
  }
};

/**
 * The options for the Mongoose XRay plugin
 * @typedef {Object} MongooseXRayOptions
 * @property {Boolean} [verbose] Specifies if additional properties should be included in the XRay metadata {Default false}
 */
