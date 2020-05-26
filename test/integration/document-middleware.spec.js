const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const mongoose = require('mongoose');
const xRayPlugin = require('../../lib');
const { xraySchema } = require('./xray-schema');
const { connect } = require('./mongo-connect');

describe('Document middleware applied to schema', function () {
  let model;
  let segment;
  let ns;
  let xRayContext;

  before(async function () {
    xraySchema.plugin(xRayPlugin, { verbose: true });
    await connect();
    model = mongoose.model('xray', xraySchema);
  });

  beforeEach(function () {
    segment = new AWSXRay.Segment('mongoose-xray-test');

    ns = AWSXRay.getNamespace();
    xRayContext = ns.createContext();
    ns.enter(xRayContext);
    AWSXRay.setSegment(segment);
  });

  afterEach(function () {
    segment.close();
    ns.exit(xRayContext);
  });

  it('should save with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const newDoc = await model.create({
      type: 'testType',
      identifier: '1234567890',
    });

    expect(newDoc).to.be.ok();
    expect(addSubsegmentSpy).to.have.been.calledOnce();
    expect(addSubsegmentSpy.returnValues[0]).to.be.ok();
    const subsegment = addSubsegmentSpy.returnValues[0];
    const metaData = subsegment.metadata.default;
    expect(metaData.operation).to.equal('save');
    expect(metaData.document).to.be.ok();
  });

  it('should remove with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');

    const newDoc = await model.create({
      type: 'testType',
      identifier: '1234567890',
    });

    await newDoc.remove();

    expect(newDoc).to.be.ok();
    expect(addSubsegmentSpy).to.have.been.calledTwice();
    const subsegment = addSubsegmentSpy.returnValues[1];
    const metaData = subsegment.metadata.default;
    expect(metaData.operation).to.equal('remove');
    expect(metaData.document).to.be.ok();
  });
});
