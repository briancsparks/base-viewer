
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

const dataBootstrap           = 'dataBootstrap';

_.each(require('sgsg/flow'), (value, key) => { sg[key] = value; });

var dataCount = 0;

export function attachToFeed() {
  const feedEndpoint = config.urlFor('feed', `feed?clientId=${config.getClientId()}&watch=bsdf&exectJson=1`, true);
  
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
          crackPayload(payload);
        }

        dataCount += 2;

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

  // The first layer should be our clientId
  if (payload[config.getClientId()]) {
    payload = payload[config.getClientId()];
  }

  // Next is the requestId, if any
  if (payload[dataBootstrap]) {
    payload = payload[dataBootstrap];

//  } else if () {    /* other message names here */
  }

  // OK, we are at the real data
  _.each(payload, (aPayload, key) => {
      
    // We may eventually have intelligence here, but for now,
    // let the dynamic dispatcher handle it

    dyamicAction(key, aPayload);
  });
}

export default function getSessionData() {

  // First, make a long-term connection to the server
  attachToFeed();

  // Then, let it connect; then send request to the server for data
  const queryEndpoint = config.urlFor('query', `querySessions?destKey=asdf&requestId=${dataBootstrap}&limit=3`, true);
  sg.setTimeout(2200, function() {

    return sg.until(function(again, last, count, elapsed) {

      // Have we gotten any data yet?
      if (dataCount >= 10) {
        return last();
      }

      return request.get(queryEndpoint).end(function(err, res) {

        // This response doesnt matter much
        //console.log(err, res.body || res.text || 'none');

        // I may have  gotten a response, but what matters is that the other loop gets data
        return again(750);
      });
    }, function() {
      //console.log('Done driving initial fetch of data');
    });
  });

  

}

