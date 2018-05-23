
import React                  from 'react';
import Reflux                 from 'reflux';
import {
  NavDropdown,
  MenuItem,
}                             from 'react-bootstrap';
import RawTelemetryStore      from '../Stores/RawTelemetryStore';
// import _                      from 'underscore';
import {
  Actions
}                             from '../Actions/Actions';

import '../short.css';

const sg                      = require('sgsg/lite');

const deref                   = sg.deref;

const {
  setCurrentSessionEz
} = Actions;


export class ItemList extends Reflux.Component {

  constructor(props) {
    super(props);
    this.store = RawTelemetryStore;
  }

  render() {

    const itemType    = this.props.itemType          || ''; 
    const itemKeyName = this.props.itemKeyName       || '';
    const items       = this._getItems();

    const myOnSelect  = this._onItemChosen.bind(this);

    return (
      <NavDropdown
          title={`${itemType}`}
          eventKey={1}
          id={`${itemType}-choice-button`}
      >
      {
        items.map((item, i) => (
          <MenuItem eventKey={i} key={i} onSelect={myOnSelect} >{item[itemKeyName]}</MenuItem>
        ))
      }
      </NavDropdown>
    );
  }

  _getItems() {
    const itemType    = this.props.itemType          || ''; 

    return deref(this.state, itemType)  || [];
  }

  _onItemChosen(eventKey, event) {
    const item = this._getItems()[eventKey];
    // console.log(`onItemChosen ${eventKey}`, item);
    setCurrentSessionEz(item);
  }

}

