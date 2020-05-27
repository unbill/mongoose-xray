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

describe('Query middleware applied to schema', function () {
  let model;
  let segment;
  let ns;
  let xRayContext;

  before(async function () {
    mongoose.set('useFindAndModify', false);
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
  });

  afterEach(function () {
    segment.close();
    ns.exit(xRayContext);
  });

  it('should count with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.count({
      type: 'testType',
    });

    expect(result).to.be.greaterThan(1);
    verifySpy(addSubsegmentSpy, 'count');
  });

  it('should countDocuments with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.countDocuments({
      type: 'testType',
    });

    expect(result).to.be.greaterThan(1);
    verifySpy(addSubsegmentSpy, 'countDocuments');
  });

  it('should deleteOne with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.deleteOne({
      identifier: '1234567890',
    });

    expect(result).to.be.ok();
    expect(result.deletedCount).to.equal(1);
    verifySpy(addSubsegmentSpy, 'deleteOne');
  });

  it('should deleteMany with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.deleteMany({
      identifier: '1234567891',
    });

    expect(result).to.be.ok();
    expect(result.deletedCount).to.be.greaterThan(1);
    verifySpy(addSubsegmentSpy, 'deleteMany');
  });

  it('should find with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.find({
      type: 'testType',
    });

    expect(result).to.be.ok();
    expect(result.length).to.be.greaterThan(1);
    verifySpy(addSubsegmentSpy, 'find');
  });

  it('should findOne with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.findOne({
      type: 'testType',
    });

    expect(result).to.be.ok();
    verifySpy(addSubsegmentSpy, 'findOne');
  });

  it('should findOneAndDelete with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.findOneAndDelete({
      type: 'testType',
    });

    expect(result).to.be.ok();
    expect(result.type).to.equal('testType');
    verifySpy(addSubsegmentSpy, 'findOneAndDelete');
  });

  it('should findOneAndRemove with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.findOneAndRemove({
      type: 'testType',
    });

    expect(result).to.be.ok();
    expect(result.type).to.equal('testType');
    verifySpy(addSubsegmentSpy, 'findOneAndRemove');
  });

  it('should findOneAndUpdate with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.findOneAndUpdate(
      {
        type: 'testType',
      },
      { widgetCount: 5 }
    );

    expect(result).to.be.ok();
    expect(result.type).to.equal('testType');
    const metaData = verifySpy(addSubsegmentSpy, 'findOneAndUpdate');
    expect(metaData.update).to.deep.equal({ widgetCount: 5 });
  });

  it('should update with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.update(
      {
        type: 'testType',
      },
      { widgetCount: 10 }
    );

    expect(result).to.be.ok();
    const metaData = verifySpy(addSubsegmentSpy, 'update');
    expect(metaData.update).to.deep.equal({ widgetCount: 10 });
  });

  it('should updateOne with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.updateOne(
      {
        type: 'testType',
      },
      { widgetCount: 10 }
    );

    expect(result).to.be.ok();
    const metaData = verifySpy(addSubsegmentSpy, 'updateOne');
    expect(metaData.update).to.deep.equal({ widgetCount: 10 });
  });

  it('should updateMany with plugin enabled', async function () {
    const addSubsegmentSpy = sinon.spy(segment, 'addNewSubsegment');
    const result = await model.updateMany(
      {
        type: 'testType',
      },
      { widgetCount: 12 }
    );

    expect(result).to.be.ok();
    const metaData = verifySpy(addSubsegmentSpy, 'updateMany');
    expect(metaData.update).to.deep.equal({ widgetCount: 12 });
  });
});

const verifySpy = (addSubsegmentSpy, operation) => {
  expect(addSubsegmentSpy).to.have.been.calledOnce();
  expect(addSubsegmentSpy.returnValues[0]).to.be.ok();
  const subsegment = addSubsegmentSpy.returnValues[0];
  const metaData = subsegment.metadata.default;
  expect(subsegment.annotations.model).to.equal('xray');
  expect(subsegment.annotations.operation).to.equal(operation);
  expect(metaData.filter).to.be.ok();
  return metaData;
};
