
/**
 *
 */
import Reflux                 from 'reflux';
import {
  Actions, RawTimeSeriesActions
}                             from '../Actions/Actions';

import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');

const setOnn                  = sg.setOnn;
// const deref                   = sg.deref;

export default class RawTelemetryStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};
    this.listenToMany(Actions, RawTimeSeriesActions);

    // export const Actions = Reflux.createActions(['addSessions', 'addClients', 'setCurrentSession', 'setCurrentClient']);
    // export const RawTimeSeriesActions = Reflux.createActions(['addRawTimeSeriesData', 'addRawTimeSeriesFeedData']);
  }

  onAddSessions(data_) {

    const existingKeys = sg.keyMirror(_.pluck(this.state.sessions, 'sessionId'));
    const data = hydrate(data_.items, 'sessionId', existingKeys);
    const sessions = _.sortBy([...(this.state.sessions || []), ...(data || [])], 'ctime');

    this.setState({sessions});
  }
  
  onAddClients(data_) {

    const existingKeys = sg.keyMirror(_.pluck(this.state.clients, 'clientId'));
    const data = hydrate(data_.items, 'clientId', existingKeys);
    const clients = _.sortBy([...(this.state.clients || []), ...(data || [])], 'ctime');

    this.setState({clients});
  }

  /**
   * 
   * @param {*} session - an Object or String to indicate the sessionId of the current session
   */
  onSetCurrentSession(session) {

    const newSessionId = session.sessionId || session;
    if (!_.isString(newSessionId)) {
      console.error(`Trying to set the current session, need sessionId (a String), have:`, newSessionId);
      return;
    }

    if (newSessionId === this.state.currentSessionId) {
      return;
    }

    this.setState({currentSessionId : newSessionId});
  }

  onSetCurrentClient(client) {

    const newClientId = client.clientId || client;
    if (!_.isString(newClientId)) {
      console.error(`Trying to set the current client, need clientId (a String), have:`, newClientId);
      return;
    }

    if (newClientId === this.state.currentClientId) {
      return;
    }

    this.setState({currentClientId : newClientId});
  }

  onAddRawTimeSeriesFeedData(payload) {

    var   numBits;
    var   newState    = {};
    const dataPoints  = payload.dataPoints || payload;
    // const obj         = _.omit(dataPoints, 'items', 'payload');
    // var   tick0       = dataPoints.tick0 || 0;

    // If you want real dates (you dont), comment this out
    // tick0 = 0;

    var items = dataPoints.items || dataPoints.payload || [];

    // Keep track of the first and last items
    newState.firstTick = this.state.firstTick || items[0].tick || 999999999;
    newState.lastTick  = this.state.lastTick  || items[0].tick || 0;

    items = _.map(items, (event) => {
      if (!event.eventType) {
        console.log(`event without type`, {event});
      }

      var result = sg.kv(event, 'eventTypeKey', cleanKey(event.eventType));

      if (result.tick) {
        newState.firstTick = Math.min(newState.firstTick, result.tick);
        newState.lastTick  = Math.max(newState.lastTick,  result.tick);
      }

      result = sg.kv(result, 'ip', bestIp(event));
      if (result.ip) {
        numBits = numBits || computeNumBits(result.ip);
        setOnn(result, 'nodeNum', nodeNumber(result.ip, numBits));
      }

      return result;
    });


  }

  onAddRawTimeSeriesData(tsData) {

  }  

}

/**
 * Fills out and sanitizes/fixes objects.
 * 
 * When data is fetched from the server, it is in a raw form. Some because JSON is not rich
 * enough to hold all the data types we want, like Date(); some because the data was sent to
 * the server in a convienent format, etc.
 * 
 * Duplicates are also removed. If we already have sessionId `abc123`, for example, it is
 * removed from the result.
 * 
 * Known keys like `ctime` converted to Date.
 * Strings that are all digits converted to numbers.
 * `true` and `false` converted to boolean.
 * etc.
 * 
 * @param {*} data -- The item to be hydrated
 * @param {*} keyName -- The key name used to remove dups (like `sessionId`).
 * @param {*} existingKeys -- The list of already known keys to remove dups.
 */
function hydrate(data, keyName, existingKeys) {

  // Handle if `data` is an Array
  if (_.isArray(data)) {
    return _.compact(_.map(data, one));
  }

  // Handle if `data` is an Object
  return sg.reduce(data, {}, (m,v,k) => {
    return sg.kv(m, k, one(v));
  });

  // The function that does the sanitization/de-dup.
  function one(datum) {

    // Ignore if this is a known object
    if (keyName && datum[keyName] in existingKeys) {
      return null;
    }

    // Look at all of the attributes and sanitize
    return sg.reduce(datum, {}, (m, v, k) => {
      var   value = v;
      if (k in {ctime:true, mtime:true, atime:true}) {
        value = new Date(v);
      } else if (v === 'true') {
        value = true;
      } else if (v === 'false') {
        value = false;
      } else if (_.isString(v)) {
        if (v.match(/^[+-]?(?=.)(?:\d+,)*\d*(?:\.\d+)?$/)) {
          value = 0+ v;
        } else if (v.match(/^\d+[.]\d+[.]\d+[.]\d+$/)) {
          if (k.toLowerCase() !== 'ip') {
            m = sg.kv(m, 'ip', datum.ip || v);
          }
        }
      }

      return sg.kv(m, k, value);
    });
  }
}


function ipNumber(ip_) {
  const ip = ip_.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ip)  { return 0; }

  return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
}

function ipMask(maskSize) {
  return -1 << (32 - maskSize);
}

// eslint-disable-next-line no-unused-vars
function nodeNumber(ip, numBits) {
  if (sg.isnt(ip) || sg.isnt(numBits) || !_.isString(ip)) { return; }

  return ipNumber(ip) & ~ipMask(numBits);
}

// eslint-disable-next-line no-unused-vars
function cleanKey(key) {
  if (sg.isnt(key))   { return key; }

  return key.replace(/[^a-zA-Z0-9_]/ig, '_');
}

// eslint-disable-next-line no-unused-vars
function bestIp(event) {
  if (event.ip) { return event.ip; }
  if (event.IP) { return event.IP; }
  if (event.Ip) { return event.Ip; }

  const ip = sg.reduce(event, null, (m, v, key) => {
    var isIpFormat = false;
    if (_.isString(v) && v.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)) {
      isIpFormat = true;
    }

    if (isIpFormat && key.toLowerCase().endsWith('ip')) {
      return v;
    }

    if (m) { return m; }

    if (isIpFormat) {
      return v;
    }

    return null;
  });

  if (!ip) {
    return /*undefined*/;
  }

  return ip;
}

// eslint-disable-next-line no-unused-vars
function computeNumBits(sampleIp) {
  if (sg.isnt(sampleIp))      { return sampleIp; }
  if (!_.isString(sampleIp))  { return; }

  var numBits = 24;             /* 192.168... */
  if (sampleIp && !sampleIp.startsWith('192.168')) {
    numBits = 21;
  }

  return numBits;
}


