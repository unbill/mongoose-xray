# mongoose-xray

A Mongoose plugin to log requests and subsegments through AWSXray.
This library requires Mongoose 5.x.

## Setup

The plugin relies on AWS XRay automatic mode being in effect.

For more details on using XRay, see the [docs](https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference)

## Usage

Simply register as a normal mongoose plugin. 

*Note* that the plugin must be added before a connection is established.

```js

const xRayPlugin = require('mongoose-xray');
const gameSchema = new Schema({ ... });
gameSchema.plugin(xRayPlugin);

// Can also be registered as a global plugin
const mongoose = require('mongoose');
mongoose.plugin(require('mongoose-xray'));


```

If the options have the verbose flag turned on, more metadata will be added to XRay, 
potentially at the expense of performance

```js
const mongoose = require('mongoose');
mongoose.plugin(require('mongoose-xray'), { verbose:true });
```

### Options
- `verbose` Adds additional metadata based on the type of operaton being conducted


## Output
For all operations, XRay will record:
- Model name as the segment name
- Operation as metadata
- Query middleware also records the filter by default

With verbose:true, the following will be added:
#### Queries
- update - The update if available
- options - Query options
- populatedPaths - Query paths populated

#### Documents
- document - Stringified document

#### Aggregates
- options - Aggregate options
- aggregate - Stringified aggregate
