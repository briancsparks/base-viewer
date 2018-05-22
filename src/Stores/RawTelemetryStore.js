
/**
 *
 */
import Reflux                 from 'reflux';
import {
  Actions, RawTimeSeriesActions
}                             from '../Actions/Actions';

import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');

// const setOnn                  = sg.setOnn;
// const deref                   = sg.deref;

export default class RawTelemetryStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};
    this.listenToMany(Actions, RawTimeSeriesActions);

    // export const Actions = Reflux.createActions(['addSessions', 'addClients', 'setCurrentSession', 'setCurrentClient']);
    // export const RawTimeSeriesActions = Reflux.createActions(['addRawTimeSeriesData', 'addRawTimeSeriesFeedData']);
  }

  onAddSessions(sessions) {
    this.setState({sessions});
  }

  onAddClients(clients) {

  }

  onSetCurrentSession(session) {

  }

  onSetCurrentClient(client) {

  }

  onAddRawTimeSeriesData(tsData) {

  }

  onAddRawTimeSeriesFeedData(tsData) {

  }

}

