const AWSXRay = require('aws-xray-sdk-core');

/**
 * Closes the current xray segment
 * @param subsegmentId The subsegment to match
 */
exports.closeCurrentSegment = (subsegmentId) => {
  if (subsegmentId) {
    const segment = AWSXRay.getSegment();
    if (segment) {
      const subsegment = segment.subsegments.find((x) => x.id === subsegmentId);
      if (subsegment && !subsegment.isClosed()) {
        subsegment.close();
      }
    }
  }
};

/**
 * Handles the error by closing the current xray segment with error information
 * @param {Error} err The error
 * @param subsegmentId The subsegment to match
 */
exports.handleSegmentError = (err, subsegmentId) => {
  if (subsegmentId) {
    const segment = AWSXRay.getSegment();
    if (segment) {
      const subsegment = segment.subsegments.find((x) => x.id === subsegmentId);
      if (subsegment.isClosed()) {
        subsegment.addError(err);
      } else {
        subsegment.close(err);
      }
    }
  }
};

/**
 * The options for the Mongoose XRay plugin
 * @typedef {Object} MongooseXRayOptions
 * @property {Boolean} [verbose] Specifies if additional properties should be included in the XRay metadata {Default false}
 */
