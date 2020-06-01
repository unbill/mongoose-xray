const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);

const segmentHelpers = require('../../lib/segment-helpers');

const subsegmentFake = {
  id: '1234567890',
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

const segmentFake = {
  closedState: false,
  isClosed: function () {
    return this.closedState;
  },
  subsegments: [subsegmentFake],
};

describe('Segment helpers', function () {
  afterEach(function () {
    subsegmentFake.reset();
    sinon.restore();
  });

  it('should close current subsegment', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    segmentHelpers.closeCurrentSegment(subsegmentFake);
    expect(subsegmentFake.isClosed()).to.equal(true);
  });

  it('should not err if segment already closed', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    subsegmentFake.closedState = true;
    segmentHelpers.closeCurrentSegment(subsegmentFake);
    expect(subsegmentFake.isClosed()).to.equal(true);
  });

  it('should add error to current segment and close it', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    segmentHelpers.handleSegmentError(new Error('test error'), subsegmentFake);
    expect(subsegmentFake.isClosed()).to.equal(true);
    expect(subsegmentFake.currentError).to.be.ok();
    expect(subsegmentFake.currentError.message).to.equal('test error');
  });
});
