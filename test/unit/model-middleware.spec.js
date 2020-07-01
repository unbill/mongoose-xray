const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const middleware = require('../../lib/model-middleware');

const subsegmentFake = {
  addMetadata: sinon.spy(),
  addAnnotation: sinon.spy(),
};
const segmentFake = {
  addNewSubsegment: sinon.stub().returns(subsegmentFake),
};

describe('Model middleware', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should register the middleware on the schema', function () {
    const schema = {
      pre: sinon.spy(),
      post: sinon.spy(),
    };
    middleware.registerModelMiddleware(schema);

    expect(schema.pre).to.have.been.calledOnce();
    expect(schema.post).to.have.been.calledTwice();
  });

  it('should create a model subsegment', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const model = {
      modelName: 'testModelName',
    };
    middleware.createModelSubsegment('insertMany', model);
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      'mongodb.model'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'model',
      'testModelName'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'testModelName-insertMany',
      'model'
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'operation',
      'insertMany'
    );
    expect(subsegmentFake.namespace).to.equal('remote');
  });
});
