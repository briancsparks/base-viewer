
/**
 *  Gets data from the server.
 */
import Reflux       from 'reflux';
import request      from 'superagent';
import { config }   from '../utils-to-move';
import {
  Actions,
  TimeSeriesActions,
  RawTimeSeriesActions,
  sessionInfoRequestId
}                             from '../Actions/Actions';
import RawTelemetryStore      from '../Stores/RawTelemetryStore';
import TimeSeriesStore        from '../Stores/TimeSeriesStore';

Reflux.initStore(RawTelemetryStore);
Reflux.initStore(TimeSeriesStore);

const sg                      = require('sgsg/lite');
const _                       = require('underscore');

const {
  addTimeSeriesData,
} = TimeSeriesActions;

const {
  addRawTimeSeriesFeedData,
} = RawTimeSeriesActions;

const {
  addSessions,
  addClients,
  setCurrentSessionId
} = Actions;

const numSessions             = 10;
const dataBootstrap           = 'dataBootstrap';

_.each(require('sgsg/flow'), (value, key) => { sg[key] = value; });

var dataCount = 0;
var feedRequestCount = 1;
export function attachToFeed() {
  const feedEndpoint = config.urlFor('feed', `feed?clientId=${config.getClientId()}&expectJson=1`, true);
  
  return sg.until(function(again, last, count, elapsed) {
    return sg.__run3([function(next, enext, enag, ewarn) {

      // Make sure we wait at the beginning of each time throught the loop
      return sg.setTimeout(10, next);

    }, function(next, enext, enag, ewarn) {
      return request.get(feedEndpoint+`&count=${feedRequestCount}`).end(function(err, res) {
        feedRequestCount += 1;

        // If there is an HTTP error, report it and try again
        if (!sg.ok(err, res)) {
          console.error(err, `Failure getting ${feedEndpoint}`);
          return again(500);
        }

        

        // If we got an empty response, just wait a few and try again
        if (!res.body) { return again(750); }

        var payload = res.body;
        if (_.isString(payload)) {
          payload = sg.safeJSONParseQuiet(payload);
        }

        // We got data, dispatch it
        if (payload) {
          dataCount += crackPayload(payload);
        }

        return again();
      });
    }], function() {
      return last();
    });
  }, function() {
  });

}

function crackPayload(payload_) {
  var payload__ = payload_ || {};

  if (!_.isArray(payload__)) {
    return crackPayload([payload__]);
  }

  var itemCount = 0;

  const payloadList = payload__;
  _.each(payloadList, (payload) => {
    var prefix = '';    // eslint-disable-line no-unused-vars

    // Next is the requestId, if any
    if (payload[dataBootstrap]) {
      payload = payload[dataBootstrap];
      prefix = `${prefix}${dataBootstrap}.`;
  
    } else if (payload[sessionInfoRequestId]) {    /* other message names here */
      payload = payload[sessionInfoRequestId];
      prefix = `${prefix}${sessionInfoRequestId}.`;
    }
  
    // If it is raw data, the next index will be 'dataPoints'
    if (payload.dataPoints && payload.dataPoints.items) {
      return addRawTimeSeriesFeedData(payload);
    }
  
    // OK, we are at the real data
    _.each(payload, (aPayload, key) => {
  
      const tsm = aPayload.timeSeriesMap;
      if (tsm) {
        _.each(tsm, (ts, name) => {
          var tsItem = _.omit(aPayload, 'timeSeriesMap');
          tsItem.name = name;
          tsItem.timeSeries = ts;
  
          addTimeSeriesData(tsItem);
        });
  
        setCurrentSessionId(aPayload.sessionId);
        return;
      }
  
      // Count the nuber of items
      itemCount += arrayCount(aPayload) + arrayCount(aPayload.items);
  
      // We may eventually have intelligence here, but for now,
      // let the dynamic dispatcher handle it
  
      // dyamicAction(key, aPayload);
      if (key === 'sessions') {
        addSessions(aPayload);
      } else if (key === 'clients') {
        addClients(aPayload);
      }
    });
  });


  return itemCount;
}

const xtime = new Date();
const goodSamples = _.map([{
  "sessionId" : "A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC-20180312124354509",
}, {
  "sessionId" : "A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC-20180508184651460",
}, {
  "sessionId" : "mYagFRwcqeyX6E0ISpC7WV5sA1yVadIWowiADINqxHUG4ldh0rUcPmc4B0iKKVo0-20180601165717403",
}, {
  "sessionId" : "mYagFRwcqeyX6E0ISpC7WV5sA1yVadIWowiADINqxHUG4ldh0rUcPmc4B0iKKVo0-20180603220418569",
}], item => sg.extend({mtime:xtime, ctime:xtime, clientId:item.sessionId.split('-')[0]}, item));

// A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC-20180509123707558

var numRequests = 0;
export default function getSessionData() {
  if (numRequests> 7) { return; }
  
  // First, make a long-term connection to the server
  attachToFeed();

  addSessions({items:goodSamples});

  // Then, let it connect; then send request to the server for data
  const queryEndpoint = config.urlFor('query', `querySessions?destKey=asdf&requestId=${dataBootstrap}&limit=${numSessions}&dataType=dbRecords`, true);

  sg.setTimeout(2200, function() {

    // Heres a good one
    'A00CIOMLvczYMoUcdf0Vhy6SDuzlvwgWlXsqiu70vIOVttuC10gx0SojgN8faUHC';

    return sg.until(function(again, last, count, elapsed) {

      // Have we gotten any data yet?
      if (dataCount >= numSessions) {
        return last();
      }

      return request.get(queryEndpoint).end(function(err, res) {
        numRequests += 1

        // This response doesnt matter much

        // I may have  gotten a response, but what matters is that the other loop gets data
        return again(1500);
      });
    }, function done() {
    });
  });
}


function arrayCount(arr) {
  if (!_.isArray(arr))  { return 0; }

  return arr.length;
}

