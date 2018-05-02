

const FluxDispatcher          = require('flux');
const Dispatcher              = new FluxDispatcher();

Dispatcher.handleAction = function(action) {
  this.dispatch({
    source    : 'ACTION',
    action    : action
  });
};

