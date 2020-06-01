const AWSXRay = require('aws-xray-sdk-core');

/**
 * Closes the current xray segment
 * @param subsegment The subsegment to match
 */
exports.closeCurrentSegment = (subsegment) => {
  if (subsegment) {
    if (!subsegment.isClosed()) {
      subsegment.close();
      exports.logDebugSafe(
        `Mongoose-XRay: Closed subsegment with ID: ${subsegment.id}`
      );
    } else {
      exports.logWarnSafe(
        `Mongoose-XRay: Could not close subsegment: Already closed: ${subsegment}`
      );
    }
  } else {
    exports.logDebugSafe(
      `Mongoose-XRay: Could not close subsegment: None provided`
    );
  }
};

/**
 * Handles the error by closing the current xray segment with error information
 * @param {Error} err The error
 * @param subsegment The subsegment to match
 */
exports.handleSegmentError = (err, subsegment) => {
  if (subsegment) {
    if (subsegment.isClosed()) {
      subsegment.addError(err);
    } else {
      subsegment.close(err);
    }
  } else {
    exports.logDebugSafe(
      `Mongoose-XRay: Could not close subsegment: None provided`
    );
  }
  exports.logWarnSafe('Mongoose-XRay: Error in segment: ', err);
};

/**
 * Logs the message at debug level if logger is available
 * @param message
 */
exports.logDebugSafe = (message) => {
  const logger = AWSXRay.getLogger();
  if (logger && logger.debug) {
    logger.debug(message);
  }
};

/**
 * Logs the message at warning level if logger is available
 * @param message
 */
exports.logWarnSafe = (message) => {
  const logger = AWSXRay.getLogger();
  if (logger && logger.warn) {
    logger.warn(message);
  }
};

/**
 * The options for the Mongoose XRay plugin
 * @typedef {Object} MongooseXRayOptions
 * @property {Boolean} [verbose] Specifies if additional properties should be included in the XRay metadata {Default false}
 */
