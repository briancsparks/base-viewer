
/**
 *
 */
import Reflux                 from 'reflux';
import { _ }                  from 'underscore';
import RawTelemetryStore      from './RawTelemetryStore';

const sg                      = require('sgsg/lite');

const setOnn                  = sg.setOnn;
const deref                   = sg.deref;


export default class TimeSeriesStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};

    var rawTelemetryStore = Reflux.initStore(RawTelemetryStore);

    // RawTelemetryStore.listen(this.onChange.bind(this));
    this.listenTo(rawTelemetryStore, this.onRawTelemetryStoreChange.bind(this), function(state) {
      var i = 10;
    });
  }

  onRawTelemetryStoreChange(x) {
    var i = 10;
  }

}
