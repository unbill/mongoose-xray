# mongoose-xray

A Mongoose plugin to log requests and subsegments through AWSXray.
This library requires Mongoose 5.x.

## Setup

The plugin relies on AWS XRay automatic mode being in effect.

For more details on using XRay, see the [docs](https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference)

## Usage

Simply register as a normal mongoose plugin. 

*Note* that the plugin must be added before the model is created from the schema.

```js

const xRayPlugin = require('mongoose-xray');
const gameSchema = new Schema({ ... });
gameSchema.plugin(xRayPlugin);

// Can also be registered as a global plugin
const mongoose = require('mongoose');
mongoose.plugin(require('mongoose-xray'));


```

If the options have the verbose flag turned on, more metadata will be added to XRay, 
potentially at the expense of performance.
Verbose information is off by default for performance and security considerations.

```js
const mongoose = require('mongoose');
mongoose.plugin(require('mongoose-xray'), { verbose:true });
```

### Options
- `verbose` Adds additional metadata based on the type of operation being conducted


## Output
For all operations, XRay will record:
- Model name + operation as the segment name
- Model name as an annotation
- Operation as metadata

With verbose:true, the following will be added:
#### Queries
- filter - The filter applied to the query operation
- update - The update if available
- options - Query options
- populatedPaths - Query paths populated

#### Documents
- document - Stringified document

#### Aggregates
- options - Aggregate options
- aggregate - Stringified aggregate
