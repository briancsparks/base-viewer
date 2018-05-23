
/**
 *
 */
import Reflux                 from 'reflux';
import { _ }                  from 'underscore';
import RawTelemetryStore      from './RawTelemetryStore';

// const sg                      = require('sgsg/lite');

// const setOnn                  = sg.setOnn;
// const deref                   = sg.deref;


export default class TimeSeriesStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};

    var rawTelemetryStore = Reflux.initStore(RawTelemetryStore);

    // RawTelemetryStore.listen(this.onChange.bind(this));
    this.listenTo(rawTelemetryStore, this.onRawTelemetryStoreChange.bind(this), function(state) {
       // eslint-disable-next-line no-unused-vars
      var i = 10;
    });
  }

  onRawTelemetryStoreChange(x) {

    _.each(x, function(value, key) {
      var fname = `onRawTelemetry${initialCase(key)}Change`;
      var fn    = this[fname];

      if (_.isFunction(fn)) {
        fn(x);
      } else {
        console.warn(`${fname} does not exist on TimeSeriesStore`);
      }

    }, this);
  }

  onRawTelemetryClientsChange(x) {
    // eslint-disable-next-line no-unused-vars
    var j = 10;
  }

}

function initialCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
