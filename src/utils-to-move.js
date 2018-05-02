
/**
 *  Utilites that should be in other packages, but they are here for now.
 */
var   sg                      = require('sgsg/lite');
const _                       = require('underscore');
const urlLib                  = require('url');

_.each(require('sgsg/flow'), (value, key) => { sg[key] = value; });

 // This is what the server would return
const startupConfig = {
  "upstreams": {
    "telemetry": "http://teal-b47.mobilewebassist.net/ntl/api/v1/blue",
    "attrstream": "http://teal-b47.mobilewebassist.net/ntl/api/v1/blue"
  },
  "preference": {},
  "upstream": "http://teal-b47.mobilewebassist.net/ntl/api/v1/blue"
};

export class Config {

  constructor() {
    this.startupConfig = startupConfig;
  }

  urlFor(sub, theRest, isProtectedRoute) {
    const root    = startupConfig.upstreams[sub] || startupConfig.upstream;
    const fullUrl = _.compact([root, theRest]).join('/');
    const url     = urlLib.parse(fullUrl);

    if (isProtectedRoute) {
      return url.path.replace('/api/', '/xapi/');
    }

    return url.path;
  }
}

export let config = new Config();


