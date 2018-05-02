
// Add sessions, add clients
import Dispatcher             from '../Flux/Dispatcher';

const sg                      = require('sgsg/lite');

const Actions = sg.keyMirror([
  'ADD_SESSIONS',
  'ADD_CLIENTS'
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

export function dyamicAction(key_, data) {
  if (!data) { return; }

  var key = '';
  if (key_ === 'sessions') {
    key = 'ADD_SESSIONS';
  } else if (key_ === 'clients') {
    key = 'ADD_CLIENTS';
  }

  Dispatcher.handleAction({
    actionType    : key,
    data          : data
  });
};

export { Actions };

