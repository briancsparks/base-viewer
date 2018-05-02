
// Add sessions, add clients
import Dispatcher             from '../Flux/Dispatcher';

const sg                      = require('sgsg/lite');

const Actions = sg.keyMirror([
  'ADD_SESSIONS', 'SET_CURRENT_SESSION',
  'ADD_CLIENTS',  'SET_CURRENT_CLIENT'
]);


export function addSessions(sessionData) {
  if (!sessionData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.ADD_SESSIONS,
    data          : sessionData
  });
};

export function addClients(clientData) {
  if (!clientData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.ADD_CLIENTS,
    data          : clientData
  });
};

export function setCurrentSession(sessionData) {
  if (!sessionData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.SET_CURRENT_SESSION,
    data          : sessionData
  });
};

export function setCurrentClient(clientData) {
  if (!clientData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.SET_CURRENT_CLIENT,
    data          : clientData
  });
};

export function dyamicAction(key_, data) {
  if (!data) { return; }

  var key = '';
  if (key_ === 'sessions') {
    key = Actions.ADD_SESSIONS;
  } else if (key_ === 'clients') {
    key = Actions.ADD_CLIENTS;
  }

  Dispatcher.handleAction({
    actionType    : key,
    data          : data
  });
};

export { Actions };

