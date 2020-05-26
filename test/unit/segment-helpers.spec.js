const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);

const segmentHelpers = require('../../lib/segment-helpers');

const segmentFake = {
  closedState: false,
  currentError: null,
  addError: function (err) {
    this.currentError = err;
  },
  isClosed: function () {
    return this.closedState;
  },
  close: function (err) {
    this.closedState = true;
    if (err) {
      this.addError(err);
    }
  },
  reset: function () {
    this.closedState = false;
    this.currentError = null;
  },
};

describe('Segment helpers', function () {
  afterEach(function () {
    segmentFake.reset();
    sinon.restore();
  });

  it('should close current segment', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    segmentHelpers.closeCurrentSegment();
    expect(segmentFake.isClosed()).to.equal(true);
  });

  it('should not err if segment already closed', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    segmentFake.closedState = true;
    segmentHelpers.closeCurrentSegment();
    expect(segmentFake.isClosed()).to.equal(true);
  });

  it('should add error to current segment and close it', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    segmentHelpers.handleSegmentError(new Error('test error'));
    expect(segmentFake.isClosed()).to.equal(true);
    expect(segmentFake.currentError).to.be.ok();
    expect(segmentFake.currentError.message).to.equal('test error');
  });
});
