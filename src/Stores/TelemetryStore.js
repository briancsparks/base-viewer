
import Dispatcher             from '../Flux/Dispatcher';
import { EventEmitter }       from 'fbemitter';
import {
  Actions,
  // setCurrentSession
}                             from '../Actions/Actions';
// import { TimeSeries }         from 'pondjs';
import { _ }                  from 'underscore';
import { TimeSeries } from 'pondjs/lib/entry';

const sg                      = require('sgsg/lite');

const magicSessionId = 'A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC-20180312124354509';

class TelemetryStore extends EventEmitter {

  constructor() {
    super();

    this.data = {
      telemetry           : {},
      sessions            : [],
      clients             : [],
      currentSessionId    : '',
      currentClientId     : ''
    };

    Dispatcher.register(this._handleDispatch.bind(this));
  }

  _handleDispatch(payload) {
    const { actionType, data }  = payload.action;
    var   didChange             = false;

    switch (actionType) {
    case Actions.ADD_SESSIONS:
      didChange = this._addSessions(data);
      break;

    case Actions.SET_CURRENT_SESSION:
      didChange = this._setCurrentSession(data);
      break;

    case Actions.ADD_CLIENTS:
      didChange = this._addClients(data);
      break;

    case Actions.SET_CURRENT_CLIENT:
      didChange = this._setCurrentClient(data);
      break;
      
    case Actions.ADD_TIMESERIES_DATA:
      didChange = this._addTimeSeriesData(data);
      break;

    case Actions.ADD_FEED_DATA:
      didChange = this._addFeedData(data);
      break;

    case Actions.SHOW_DATA_TYPES_IN_CONSOLE:
      this._showDataTypesInConsole();
      break;
      
    default:
      break;
    }

    // var report = _.pick(this.data, 'currentSessionId', 'currentClientId');
    // report.sessions = (sg.deref(this, ['data', 'sessions'])) || 0;
    // report.clients  = (sg.deref(this, ['data', 'clients'])) || 0;
    // console.log(report);


    if (didChange) {
      this.emit('change');
    }
  }

  _addTimeSeriesData(data) {
    const name      = data.timeSeries.name;
    const sessionId = data.sessionId || 'anonymous';

    const ts = new TimeSeries(data.timeSeries);

    this.data.telemetry[sessionId] = this.data.telemetry[sessionId] || {};
    if (!this.data.telemetry[sessionId][name]) {
      this.data.telemetry[sessionId][name] = ts;
    } else {
      this.data.telemetry[sessionId][name] = TimeSeries.timeSeriesListMerge({name, seriesList: [this.data.telemetry[sessionId][name], ts]});;
    }

    // console.log(`${name} now has ${this.data.telemetry[sessionId][name].size()} items in the DB`);
    return true;
  }

  // feed data will be like:
  // {
  //       "dataPoints": {
  //         "x_real_ip": "76.88.97.224",
  //         "clientId": "A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC",
  //         "sessionId": "A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC-20180508185955618",
  //         "projectId": "ntl",
  //         "partnerId": "HP_NTL_SERVICE",
  //         "username": "bcs",
  //         "version": 1,
  //         "tick0": 1525831196999.9011,
  //         "dataType": "telemetry",
  //         "items": [
  //           {
  //             "mod": "controller",
  //             "eventType": "mwpUp",
  //             "loopNum": 15,
  //             "startTick": 1001,
  //             "module": "controller",
  //             "tick": 1004
  //           },
  //           {
  //             "mod": "mwp_udp",
  //             "eventType": "sentPacket",
  //             "ip": "192.168.1.3",
  //             "port": 161,
  //             "bytes": 48,
  //             "module": "mwp_udp",
  //             "tick": 1005
  //           }
  //         ]
  //       }
  // }


  _addFeedData(payload) {
    const self = this;
    var changed = false;

    // --------------------------------------------------------------------
    // The payload is raw data, just like when it is uploaded (See above)
    //
    //  * We do various things to clean and enhance it:
    //    1. Use the eventType property to group all of the same events together
    //    2. Find any IP address on each event, and computing the node number
    //

    var   numBits;
    const dataPoints  = payload.dataPoints || payload;
    const obj         = _.omit(dataPoints, 'items', 'payload');
    var   tick0       = dataPoints.tick0 || 0;

    // If you want real dates (you dont), comment this out
    tick0 = 0;

    var items = dataPoints.items || dataPoints.payload || [];
    items = _.map(items, (event) => {
      if (!event.eventType) {
        console.log(`event without type`, {event});
      }

      var result = _.extend({nodeNum:1, tick:1}, sg.kv(event, 'eventTypeKey', cleanKey(event.eventType)));

      result = sg.kv(result, 'ip', bestIp(event));
      if (result.ip) {
        numBits = numBits || computeNumBits(result.ip);
        result.nodeNum = nodeNumber(result.ip, numBits);
      }

      result.nodeNum = result.nodeNum || 1;

      return result;
    });

    // Split all items into those that have an ip and those that do not
    var allWithIp     = sg.deepCopy(_.filter(items, item => item.ip));
    var allWithoutIp  = sg.deepCopy(_.filter(items, item => !item.ip));

    // allWithIp = _.filter(allWithIp, item => !(item.who === 'arp'));
    allWithIp = _.filter(allWithIp, item => !(item.eventType === 'sentPacket'));
    allWithIp = _.filter(allWithIp, item =>  (!item.eventType || !item.eventType.startsWith('found_printer')));
    // console.log(`allWithIpB`, allWithIp);
    oneB('allWithIp', allWithIp);

    allWithoutIp = _.filter(allWithoutIp, item => !(item.eventType === 'mwpUp'));
    // console.log(`allWithoutIpB`, allWithoutIp);
    oneB('allWithoutIp', allWithoutIp);

    // --------------------------------------------------------------------
    // We are starting the process of putting the data into the format that
    // pond.js and TimeSeries charts needs.
    //

    // Group all the events by type
    items = _.groupBy(items, 'eventTypeKey');

    // Loop over each event type; we will push each type group into the db one-by-one
    _.each(items, (events_, name_) => {

      // `one` is a function below. Call it on the data that was passed in
      one(name_, events_);

      // Now, if this event is claimed by someone (a `who`), give each who a group
      // in the db
      var   byWho = _.omit(_.groupBy(events_, 'who'), 'undefined');

      // Get consistent order
      byWho = _.extend({snmp:byWho.snmp, snmp_blaster:byWho.snmp_blaster}, _.omit(byWho, 'snmp', 'snmp_blaster'));

      // Loop over each `who` and push their group into the db
      _.each(byWho, (eventList, who) => {
        one(`${who.replace(/[^a-z0-9]/i,'')}_${name_}`, eventList);
      });

      // The helper funciton to push one group into the db
      function one(name, events_) {

        // Remove redundant attributes, and collect all data from the same tick together
        var events  = _.map(events_, event => _.omit(event, 'eventTypeKey'));
        events      = _.groupBy(events, 'tick');

        // Build up a `points` object, for ingestion by a TimeSeries
        const points = sg.reduce(events, [], (m, eventList, tick) => {
          const itemAtTick = _.extend({}, ...eventList);                      // like doing _.extend({}, eventList[0], eventList[1]...);
          return sg.ap(m, [+tick + tick0, itemAtTick]);
        });
  
        // The format for TimeSeries, but just data
        const timeSeries = {name, columns:['time', 'it'], points, utc:true};
        changed = self._addTimeSeriesData(_.extend({timeSeries}, obj)) || changed;
      }
    });

    // Register this sessionId as the current one.
    this._setCurrentSession(dataPoints.sessionId);

    return changed;

    // The helper funciton to push one group into the db
    function oneB(name, events_) {

      // Remove redundant attributes, and collect all data from the same tick together
      var events  = _.map(events_, event => _.omit(event, 'eventTypeKey'));
      events      = _.groupBy(events, 'tick');

      // Build up a `points` object, for ingestion by a TimeSeries
      const points = sg.reduce(events, [], (m, eventList, tick) => {
        const itemAtTick = _.extend({}, ...eventList);                      // like doing _.extend({}, eventList[0], eventList[1]...);
        return sg.ap(m, [+tick + tick0, itemAtTick]);
      });

      // The format for TimeSeries, but just data
      const timeSeries = {name, columns:['time', 'it'], points, utc:true};
      changed = self._addTimeSeriesData(_.extend({timeSeries}, obj)) || changed;
    }
  }

  _addSessions(data_) {
    const existingKeys = sg.keyMirror(_.pluck(this.data.sessions, 'sessionId'));
    const data = hydrate(data_.items, 'sessionId', existingKeys);
    const sessions = _.sortBy([...this.data.sessions, ...data], 'ctime');

    this.data.sessions = sessions;

    const newKeys = sg.keyMirror(_.pluck(sessions, 'sessionId'));
    if (newKeys[magicSessionId]) {
      sg.setTimeout(500, function() {
        // setCurrentSession(magicSessionId);
      });
    }


    return true;
  }

  _setCurrentSession(session) {
    const newSessionId = session.sessionId || session;
    if (newSessionId === this.data.currentSessionId) {
      return false;
    }

    this.data.currentSessionId = newSessionId;
    return true;
  }

  _addClients(data_) {
    const existingKeys = sg.keyMirror(_.pluck(this.data.clients, 'clientId'));
    const data = hydrate(data_.items, 'clientId', existingKeys);
    const clients = _.sortBy([...this.data.clients, ...data], 'ctime');

    this.data.clients = clients;

    return true;
  }

  _setCurrentClient(client) {
    const newClientId = client.clientId || client;
    if (newClientId === this.data.currentClientId) {
      return false;
    }

    this.data.currentClientId = newClientId;
    return true;
  }

  _showDataTypesInConsole() {

    // Show one of each of the data points, so the dev can know what to plot
    _.each(this.data.telemetry, (tData, sessionId) => {
      const oneOfEach = sg.reduce(tData, {}, (m, v, k) => {
        var value = {};

        value = sg.kv(value, 'count', v.count());
        if (v.atFirst()) {
          value = _.extend(value, v.atFirst().toJSON());
        }
        return sg.kv(m, k, value);
      });
      console.log(sessionId, oneOfEach);
    });

  }
  



  addChangeListener(callback) {
    this.addListener('change', callback);
  }

  removeChangeListener(callback) {
    this.removeAllListeners('change', callback);
  }
}


const telemetryStore = new TelemetryStore();
export default telemetryStore;


/**
 * 
 */
function hydrate(data, keyName, existingKeys) {

  if (_.isArray(data)) {
    return _.compact(_.map(data, one));
  }

  return sg.reduce(data, {}, (m,v,k) => {
    return sg.kv(m, k, one(v));
  });

  function one(datum) {
    if (datum[keyName] in existingKeys) {
      return null;
    }

    return sg.reduce(datum, {}, (m, v, k) => {
      var   value = v;
      if (k in {ctime:true, mtime:true, atime:true}) {
        value = new Date(v);
      } else if (v === 'true') {
        value = true;
      } else if (v === 'false') {
        value = false;
      }

      return sg.kv(m, k, value);
    })
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

function nodeNumber(ip, numBits) {
  if (sg.isnt(ip) || sg.isnt(numBits) || !_.isString(ip)) { return; }

  return ipNumber(ip) & ~ipMask(numBits);
}

function cleanKey(key) {
  if (sg.isnt(key))   { return key; }

  return key.replace(/[^a-zA-Z0-9_]/ig, '_');
}

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

function computeNumBits(sampleIp) {
  if (sg.isnt(sampleIp))      { return sampleIp; }
  if (!_.isString(sampleIp))  { return; }

  var numBits = 24;             /* 192.168... */
  if (sampleIp && !sampleIp.startsWith('192.168')) {
    numBits = 21;
  }

  return numBits;
}

