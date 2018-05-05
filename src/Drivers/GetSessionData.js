
/**
 *  Gets data from the server.
 */
import request      from 'superagent';
import { config }   from '../utils-to-move';
import {
  // addSessions,
  // addClients,
  dyamicAction
}                             from '../Actions/Actions';

const sg                      = require('sgsg/lite');
const _                       = require('underscore');

const numSessions             = 60;
const dataBootstrap           = 'dataBootstrap';

_.each(require('sgsg/flow'), (value, key) => { sg[key] = value; });

var dataCount = 0;

export function attachToFeed() {
  const feedEndpoint = config.urlFor('feed', `feed?clientId=${config.getClientId()}&asTimeSeries=1&dataType=telemetry&expectJson=1`, true);
  
  return sg.until(function(again, last, count, elapsed) {
    return sg.__run3([function(next, enext, enag, ewarn) {

      // Make sure we wait at the beginning of each time throught the loop
      return sg.setTimeout(1200, next);

    }, function(next, enext, enag, ewarn) {
      return request.get(feedEndpoint).end(function(err, res) {

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
        console.log(`Have ${dataCount}`);

        return again();
      });
    }], function() {
      return last();
    });
  }, function() {
  });

}

function crackPayload(payload_) {
  var payload = payload_ || {};
  var itemCount = 0;
  var prefix = '';

  // The first layer should be our clientId
  if (payload[config.getClientId()]) {
    payload = payload[config.getClientId()];
    prefix = `${prefix}${config.getClientId()}.`;
  }

  // Next is the requestId, if any
  if (payload[dataBootstrap]) {
    payload = payload[dataBootstrap];
    prefix = `${prefix}${dataBootstrap}.`;

//  } else if () {    /* other message names here */
  }

  // OK, we are at the real data
  _.each(payload, (aPayload, key) => {

    // Count the nuber of items
    itemCount += arrayCount(aPayload) + arrayCount(aPayload.items);

    console.log(`Dispatching ${prefix}${key} from server`, aPayload.items || aPayload);
      
    // We may eventually have intelligence here, but for now,
    // let the dynamic dispatcher handle it

    dyamicAction(key, aPayload);
  });

  return itemCount;
}


var numRequests = 0;
export default function getSessionData() {
  if (numRequests> 7) { return; }
  
  // First, make a long-term connection to the server
  attachToFeed();

  // Then, let it connect; then send request to the server for data
  const queryEndpoint = config.urlFor('query', `querySessions?destKey=asdf&requestId=${dataBootstrap}&limit=${numSessions}&dataType=dbRecords`, true);

  sg.setTimeout(2200, function() {

    return sg.until(function(again, last, count, elapsed) {

      // Have we gotten any data yet?
      if (dataCount >= numSessions) {
        return last();
      }

      return request.get(queryEndpoint).end(function(err, res) {
        numRequests += 1

        // This response doesnt matter much
        //console.log(err, res.body || res.text || 'none');

        // I may have  gotten a response, but what matters is that the other loop gets data
        return again(3000);
      });
    }, function() {
      //console.log('Done driving initial fetch of data');
    });
  });
}


function arrayCount(arr) {
  if (!_.isArray(arr))  { return 0; }

  return arr.length;
}

