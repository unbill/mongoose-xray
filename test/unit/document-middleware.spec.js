const chai = require('chai');
const AWSXRay = require('aws-xray-sdk-core');
const sinon = require('sinon').createSandbox();
const { expect } = chai;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const middleware = require('../../lib/document-middleware');

describe('Document middleware', function () {
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
    middleware.registerDocumentMiddleware(schema);

    expect(schema.pre).to.have.been.calledTwice();
    expect(schema.post).to.have.been.callCount(4);
  });

  it('should create a document subsegment without options', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const document = {
      constructor: { modelName: 'testModel' },
      testProperty: 'testProperty',
    };
    middleware.createDocumentSubsegment('save', document);
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      'testModel-save'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'model',
      'testModel'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'operation',
      'save'
    );
  });

  it('should create a document subsegment with verbose option', function () {
    sinon.stub(AWSXRay, 'getSegment').returns(segmentFake);
    const document = {
      constructor: { modelName: 'testModel' },
      testProperty: 'testProperty',
    };
    middleware.createDocumentSubsegment('save', document, {
      verbose: true,
    });
    expect(segmentFake.addNewSubsegment).to.have.been.calledOnceWith(
      'testModel-save'
    );
    expect(subsegmentFake.addAnnotation).to.have.been.calledWith(
      'operation',
      'save'
    );
    expect(subsegmentFake.addMetadata).to.have.been.calledWith(
      'document',
      JSON.stringify(document)
    );
  });
});
