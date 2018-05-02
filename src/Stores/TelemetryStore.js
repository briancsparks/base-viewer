
import Dispatcher             from '../Flux/Dispatcher';
import { EventEmitter }       from 'fbemitter';
import { Actions }            from '../Actions/Actions';
import { TimeSeries }         from 'pondjs';
import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');

class TelemetryStore extends EventEmitter {

  constructor() {
    super();

    this.data = {
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
    
    default:
      break;
    }

    console.log(this.data);

    if (didChange) {
      this.emit('change');
    }
  }

  _addSessions(data_) {
    const existingKeys = sg.keyMirror(_.pluck(this.data.sessions, 'sessionId'));
    const data = hydrate(data_.items, 'sessionId', existingKeys);
    const sessions = _.sortBy([...this.data.sessions, ...data], 'ctime');

    this.data.sessions = sessions;

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

