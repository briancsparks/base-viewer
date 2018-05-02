
// Add sessions, add clients
import Dispatcher             from '../Flux/Dispatcher';

const sg                      = require('sgsg');

const Actions = sg.keyMirror({
  'ADD_SESSIONS',
  'ADD_CLIENTS'
});


export function addSessions(sessionData) {
  if (!sessionData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.ADD_SESSIONS,
    data          : sessionData
  });
}

export function addClients(clientData) {
  if (!clientData) { return; }

  Dispatcher.handleAction({
    actionType    : Actions.ADD_CLIENTS,
    data          : clientData
  });
}


