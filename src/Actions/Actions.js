
// Add sessions, add clients

import request                from 'superagent';
import Dispatcher             from '../Flux/Dispatcher';
import { config }             from '../utils-to-move';

const sg                      = require('sgsg/lite');

const Actions = sg.keyMirror([
  'ADD_SESSIONS', 'SET_CURRENT_SESSION',
  'ADD_CLIENTS',  'SET_CURRENT_CLIENT'
]);

export const sessionInfoRequestId = 'sessionInfoRequestId';

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

  const sessionId = sessionData.sessionId || sessionData;

  Dispatcher.handleAction({
    actionType    : Actions.SET_CURRENT_SESSION,
    data          : sessionId
  });

  // // Now, send a query request to the server, so it will send that
  // // sessions data.
  // const queryEndpoint = config.urlFor('query',
  //     `download2?sessionId=${sessionId}&destKey=${config.getClientId()}&requestId=${sessionInfoRequestId}&dataType=telemetry&asTimeSeries=1`, true);

      
  // return request.get(queryEndpoint).end(function(err, res) {
  //   //console.log(`on request for ${queryEndpoint}, got`, {err, ok:res.ok});
  // });
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

