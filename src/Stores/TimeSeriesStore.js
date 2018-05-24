
/**
 *
 */
import Reflux                 from 'reflux';
import { _ }                  from 'underscore';
import RawTelemetryStore      from './RawTelemetryStore';
import { TimeSeries }         from 'pondjs/lib/entry';

// const sg                      = require('sgsg/lite');

// const setOnn                  = sg.setOnn;
// const deref                   = sg.deref;


export default class TimeSeriesStore extends Reflux.Store {

  constructor() {
    super();
    this.state = {};

    var rawTelemetryStore = Reflux.initStore(RawTelemetryStore);

    this.listenTo(rawTelemetryStore, this.onRawTelemetryStoreChange.bind(this), function(state) {
      // Supposedly, this is called with initial data
    });
  }

  onRawTelemetryStoreChange(x) {

    _.each(x, function(value, key) {
      var fname = `onRawTelemetry${initialCase(key)}Change`;
      var fn    = this[fname];

      if (_.isFunction(fn)) {
        fn.call(this, x);
      } else {
        this.onRawTelemetryOtherChange(key, value, x);
      }
      
    }, this);
  }
  
  onRawTelemetrySessionsChange(x) {
  }
  
  onRawTelemetryClientsChange(x) {
  }  
  
  onRawTelemetryFirstTickChange(x) {
    this.setState({firstTick: x.firstTick});
  }  
  
  onRawTelemetryLastTickChange(x) {
    this.setState({lastTick: x.lastTick});
  }  
  
  onRawTelemetryOtherChange(name, data, x) {
    
    if (data.hasOwnProperty('columns') && data.hasOwnProperty('points')) {
      this.setState({[name] : new TimeSeries(data)});
      
    } else {
      console.warn(`${name} does not exist on TimeSeriesStore`);
    }
  }  

}

function initialCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
