const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const middleware = require('../../lib/aggregate-middleware');

describe('Aggregate middleware', function () {
  let segmentFake;
  let subsegmentFake;

  beforeEach(function () {
    subsegmentFake = {
      addMetadata: sinon.spy(),
      addAnnotation: sinon.spy(),
    };
    segmentFake = {
      addNewSubsegment: sinon.stub().returns(subsegmentFake),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should register the middleware on the schema', function () {
    const schema = {
      pre: sinon.spy(),
      post: sinon.spy(),
    };
    middleware.registerAggregateMiddleware(schema);

    expect(schema.pre).to.have.been.calledOnce();
    expect(schema.post).to.have.been.calledTwice();
  });

  it('should create an aggregate subsegment without options', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const aggregate = {
      model: () => {
        return { modelName: 'testModel' };
      },
      options: { test: 'test' },
    };
    middleware.createAggregateSubsegment('aggregate', aggregate);
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      'testModel-aggregate'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'model',
      'testModel'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'operation',
      'aggregate'
    );
  });

  it('should create an aggregate subsegment with verbose option', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const aggregate = {
      model: () => {
        return { modelName: 'testModel' };
      },
      options: { test: 'test' },
    };
    middleware.createAggregateSubsegment('aggregate', aggregate, {
      verbose: true,
    });
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      'testModel-aggregate'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'operation',
      'aggregate'
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'options',
      aggregate.options
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'aggregate',
      JSON.stringify(aggregate)
    );
  });
});
