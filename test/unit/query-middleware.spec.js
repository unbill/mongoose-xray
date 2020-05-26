const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const middleware = require('../../lib/query-middleware');

describe('Query middleware', function () {
  let segmentFake;
  let subsegmentFake;

  beforeEach(function () {
    subsegmentFake = {
      addMetadata: sinon.spy(),
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
    middleware.registerQueryMiddleware(schema);

    expect(schema.pre).to.have.been.callCount(10);
    expect(schema.post).to.have.been.callCount(20);
  });

  it('should create a query subsegment without options', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const query = {
      model: { modelName: 'testModel' },
      getFilter: () => JSON.stringify({ test: 'test filter' }),
      testProperty: 'testProperty',
    };
    middleware.createQuerySubsegment('find', query);
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      query.model.modelName
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'operation',
      'find'
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'filter',
      query.getFilter()
    );
  });

  it('should create a query subsegment with verbose option', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const query = {
      model: { modelName: 'testModel' },
      getFilter: () => JSON.stringify({ test: 'test filter' }),
      getUpdate: () => JSON.stringify({ test: 'test update' }),
      getOptions: () => JSON.stringify({ test: 'test options' }),
      getPopulatedPaths: () => JSON.stringify({ paths: 'test/paths' }),
      testProperty: 'testProperty',
    };
    middleware.createQuerySubsegment('find', query, {
      verbose: true,
    });
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      query.model.modelName
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'operation',
      'find'
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'filter',
      query.getFilter()
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'update',
      query.getUpdate()
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'options',
      query.getOptions()
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'populatedPaths',
      query.getPopulatedPaths()
    );
  });
});
