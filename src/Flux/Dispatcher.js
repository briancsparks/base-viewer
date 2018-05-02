

const FluxDispatcher          = require('flux').Dispatcher;
const Dispatcher              = new FluxDispatcher();

Dispatcher.handleAction = function(action) {
  this.dispatch({
    source    : 'ACTION',
    action    : action
  });
};

module.exports = Dispatcher;
