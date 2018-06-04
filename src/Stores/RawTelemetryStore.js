
/**
 *
 */
import Reflux                 from 'reflux';
import request                from 'superagent';
import {
  Actions, RawTimeSeriesActions
}                             from '../Actions/Actions';

import { config }             from '../utils-to-move';
import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');

const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

export default class RawTelemetryStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};
    this.listenables = [Actions, RawTimeSeriesActions];
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
    this.setState(this.handleSetCurrentSession(session, {}));
  }

  handleSetCurrentSession(session, newState = {}) {

    if (!session) { return newState; }

    const sessionId = session.sessionId || session;
    if (!_.isString(sessionId)) {
      console.error(`Trying to set the current session, need sessionId (a String), have:`, sessionId);
      return newState;
    }

    if (sessionId === this.state.currentSessionId) {
      return newState;
    }

    return sg.kv(newState, 'sessionId', sessionId);
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

  onSetCurrentSessionEz(sessionData) {
    const self = this;

    if (!sessionData) { return; }

    const sessionId = sessionData.sessionId || sessionData;

    const queryEndpoint = config.urlFor('query', `getS3Keys?sessionId=${sessionId}`, true);

    // Dispatch the next HXR request
    request.get(queryEndpoint).end(function(err, res) {
      if (!sg.ok(err, res) || !res.ok) { return; }

      // console.log(`on request for ${queryEndpoint}, got`, {err, ok:res.ok});

      var   items = _.map(res.body.Contents, item => {
        if (item.LastModified) {
          item = sg.kv(item, 'LastModified', new Date(item.LastModified).getTime());
        }
        return item;
      });

      items = _.sortBy(items, 'LastModified');

      return sg.until((again, last, count) => {
        if (items.length === 0) { return last(); }

        var item = items.shift();
        if (!item.Key.match(/[/]telemetry[/]/)) { return again(); }

        const queryEndpoint2 = config.urlFor('query', `getS3?key=${item.Key}`, true);
        request.get(queryEndpoint2).end(function(err, res) {
          if (!sg.ok(err, res) || !res.ok)  { return again(); }

          // TODO: This should send an action, not make a direct call
          self.onAddRawTimeSeriesFeedData(res.body);
          return again();
        });
      }, function() {

      });

    });

    const update = sg.reduce(this.state, {}, function(m, v, k) {
      if (sg.isObject(v) && 'columns' in v && 'points' in v) {
        return sg.kv(m, k, {});
      }
      return m;
    });

    this.setState(this.handleSetCurrentSession(sessionId, update));
  }

  /**
   * Returns an object that has zero telemetry (to be used to update state to an object
   * that has empty objects for all current telemetry keys.)
   */
  emptyTelemetryUpdate() {
    return sg.reduce(this.state, {}, function(m, v, k) {
      if (sg.isObject(v) && 'columns' in v && 'points' in v) {
        return sg.kv(m, k, {});
      }
      return m;
    });
  }

  onAddRawTimeSeriesFeedData(payload) {
    const self = this;

    var   numBits;
    const dataPoints  = payload.dataPoints || payload;
    var   tick0       = dataPoints.tick0 || 0;
    const meta        = _.omit(dataPoints, 'items', 'payload');
    var   newState    = {};

    if (meta.sessionId && this.state.sessionId && meta.sessionId !== this.state.sessionId) {
      this.setState(this.emptyTelemetryUpdate());
    }

    // If you want real dates (you dont), comment this out
    tick0 = 0;

    // Add meta
    newState = setOnNewState(this.state, newState, {meta});

    var items = dataPoints.items || dataPoints.payload || [];

    // Keep track of the first and last items
    newState = setOnNewState(this.state, newState, {
      firstTick : this.state.firstTick || 999999999,
      lastTick  : this.state.lastTick  || 0
    });

    // Clean event data
    items = _.map(items, (event) => {
      if (!event.eventType) {
        console.log(`event without type`, {event});
      }

      var result = sg.kv(event, 'eventTypeKey', cleanKey(event.eventType));

      if (result.hasOwnProperty('tick')) {
        newState = setOnNewState(self.state, newState, {
          firstTick : Math.min(newState.firstTick, result.tick),
          lastTick  : Math.max(newState.lastTick,  result.tick)
        });
      }

      result = sg.kv(result, 'ip', bestIp(event));
      if (result.ip) {
        numBits = numBits || computeNumBits(result.ip);
        setOnn(result, 'nodeNum', nodeNumber(result.ip, numBits));
      }

      return result;
    });

    // ----------

    // Split all items into those that have an ip and those that do not
    var allWithIp     = sg.deepCopy(_.filter(items, item => item.ip));
    var allWithoutIp  = sg.deepCopy(_.filter(items, item => !item.ip));

    allWithIp = _.filter(allWithIp, item => !(item.who === 'arp'));
    allWithIp = _.filter(allWithIp, item => !(item.eventType === 'sentPacket'));
    allWithIp = _.filter(allWithIp, item => !(item.eventType === 'socketAvailability'));
    allWithIp = _.filter(allWithIp, item => !(item.eventType === 'stallSocketWrite'));
    allWithIp = _.filter(allWithIp, item =>  (!item.eventType || !item.eventType.startsWith('found_printer')));
    // console.log(`allWithIpB`, allWithIp);
    one('allWithIp', allWithIp);

    allWithoutIp = _.filter(allWithoutIp, item => !(item.eventType === 'mwpUp'));
    // console.log(`allWithoutIpB`, allWithoutIp);
    one('allWithoutIp', allWithoutIp);

    // ----------
    items = _.groupBy(items, 'eventTypeKey');

    const whoCare = sg.keyMirror('snmp,snmp_blaster');
    const eventTypeCare = sg.keyMirror('found_printer_MDL');
    
    _.each(items, (events, name) => {
      one(name, events);

      // Now, if this event is claimed by someone (a `who`), give each who a group in the db
      var   byWho = _.omit(_.groupBy(events, 'who'), 'undefined');

      // Loop over each `who` and push their group into the db
      _.each(byWho, (eventList, who) => {
        if (!whoCare[who]) { return; }

        const whoEventList = _.filter(eventList, event => eventTypeCare[event.eventType]);
        one(`${who.replace(/[^a-z0-9]/i,'')}_${name}`, whoEventList);
      });
    });

    newState = this.handleSetCurrentSession(dataPoints.sessionId, newState);

    this.setState(newState);

    function one(name, events_) {
      if (events_.length === 0) { return; }

      // Remove redundant attributes, and collect all data from the same tick together
      var events  = _.map(events_, event => _.omit(event, 'eventTypeKey'));
      events      = _.groupBy(events, 'tick');

      // Build up a `points` object, for ingestion by a TimeSeries
      const existingPoints = deref(self.state, [name, 'points']) || [];

      const points = sg.reduce(events, [...existingPoints], (m, eventList, tick) => {
        const itemAtTick = _.extend({}, ...eventList);                      // like doing _.extend({}, eventList[0], eventList[1]...);
        return insertOrderedPoint(m, [+tick + tick0, itemAtTick]);
      });

      // The format for TimeSeries, but just data
      const timeSeries = {name, columns:['time', 'it'], points, utc:true};
      newState = setOnNewState(self.state, newState, {[name] : timeSeries});
    }
  }

  onAddRawTimeSeriesData(tsData) {
  }
}

 function insertOrderedPoint(points, point) {

  var   i;
  const len = points.length;
  
  if (len === 0) {
    points.push(point);

  } else if (point[0] >= points[len-1][0]) {
    // Most of the time, the new point goes on the end
    points.push(point);

  } else if (point[0] <= points[0][0]) {

    points.unshift(point);

  } else {

    for (i = 0; i < len && point[0] >= points[i][0]; ++i) {
      // Nothing
    }

    points.splice(i, 0, point);

  }

  return points;
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

/**
 * Returns the String IP (converts Numbers to String representation).
 * 
 * @param {*} ip The input IP; already a String or a Number.
 */
function ipString(ip) {
  if (sg.isnt(ip))      { return ip; }
  if (_.isString(ip))   { return ip; }
  if (!_.isNumber(ip))  { return /*undefined*/; }

  // Assumes network byte-order
  return `${(ip & 0xff)}.${((ip & 0xff00) >> 8) & 0xff}.${((ip & 0xff0000) >> 16) & 0xff}.${((ip & 0xff000000) >> 24) & 0xff}`;
}

// eslint-disable-next-line no-unused-vars
function cleanKey(key) {
  if (sg.isnt(key))   { return key; }

  return key.replace(/[^a-zA-Z0-9_]/ig, '_');
}

// eslint-disable-next-line no-unused-vars
function bestIp(event) {
  if (event.ip) { return ipString(event.ip); }
  if (event.IP) { return ipString(event.IP); }
  if (event.Ip) { return ipString(event.Ip); }

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

  return ipString(ip);
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

function setOnNewState(state, newState, newNewState) {
  const keys = _.keys(newNewState);

  const result = sg.reduce(keys, newState || {}, function(m, key) {
    // TODO: check if state[key] === newNewState[key]; if so, do not add
    return _.extend(m, newState, sg.kv(key, newNewState[key]));
  });

  return result;
}



