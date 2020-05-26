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

describe('Model middleware applied to schema', function () {
  let model;
  let segment;
  let ns;
  let xRayContext;

  before(async function () {
    xraySchema.plugin(xRayPlugin, { verbose: true });
    await connect();
    model = mongoose.model('xray', xraySchema);
  });

  beforeEach(async function () {
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

  it('should aggregate with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    await model.insertMany([
      {
        type: 'testType',
        identifier: '1234567890',
        widgetCount: 1,
      },
      {
        type: 'testType2',
        identifier: '1234567891',
        widgetCount: 3,
      },
      {
        type: 'testType',
        identifier: '1234567892',
        widgetCount: 2,
      },
    ]);

    expect(addSubsegmentSpy).to.have.been.calledOnce();
    expect(addSubsegmentSpy.returnValues[0]).to.be.ok();
    const subsegment = addSubsegmentSpy.returnValues[0];
    const metaData = subsegment.metadata.default;
    expect(metaData.operation).to.equal('insertMany');
  });
});
