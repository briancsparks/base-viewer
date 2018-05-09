
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

    const ts = new TimeSeries(this._fixupTimeSeriesData(data.timeSeries));

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
    var changed = false;

    const dataPoints = payload.dataPoints;
    const obj = _.omit(dataPoints, 'items', 'payload');

    var items = dataPoints.items || dataPoints.payload || [];
    items = _.map(items, (event) => {
      return sg.kv(event, 'eventTypeKey', cleanKey(event.eventType));
    });

    items = _.groupBy(items, 'eventTypeKey');

    _.each(items, (events_, name) => {
      var events  = _.map(events_, event => _.omit(event, 'eventTypeKey'));
      events      = _.groupBy(events, 'tick');
      const points = sg.reduce(events, [], (m, eventList, tick) => {
        const itemAtTick = _.extend({}, ...eventList);                      // like doing _.extend({}, eventList[0], eventList[1]...);
        return sg.ap(m, [tick, itemAtTick]);
      });

      const timeSeries = {name, columns:['time', 'it'], points, utc:true};
      changed = this._addTimeSeriesData(_.extend({timeSeries}, obj)) || changed;
    });

    this._setCurrentSession(dataPoints.sessionId);

    return changed;
  }

  _fixupTimeSeriesData(ts) {
    var result = _.omit(ts, 'points');

    result.points = _.map(ts.points, (point) => {

      // If we already have ip, just return it
      if (point[1].ip) {
        return point;
      }

      const ip = bestIp(point[1]);
      var   ipObj = {};
      if (ip) {
        ipObj.ip = ip;
      }
      var pointData = _.extend(ipObj, point[1]); 
      return [point[0], pointData];
    });

    // TODO: compute numBits
    const numBits = 22;

    result.points = _.map(result.points, (point) => {
      const ip = point[1].ip;
      if (!ip) { return point; }

      return [point[0], _.extend({nodeNum:nodeNumber(ip, numBits)}, point[1])];
    });

    return result;
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
        value = _.extend(value, v.atFirst().toJSON());
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

function bestIp(obj) {
  if (obj.ip) {
    return obj.ip;
  }

  return sg.reduce(obj, null, (m, v) => {
    if (m) { return m; }
    if (_.isString(v) && v.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)) {
      return v;
    }
    return m;
  })
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
  return ipNumber(ip) & ~ipMask(numBits);
}

function cleanKey(key) {
  if (sg.isnt(key))   { return key; }

  return key.replace(/[^a-zA-Z0-9_]/ig, '_');
}

