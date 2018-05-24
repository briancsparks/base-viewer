
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import './index.css';

//var element = React.createElement('h1', { className: 'greeting' }, 'Hello, world!');
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();

