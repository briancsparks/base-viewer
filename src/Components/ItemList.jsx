
import React, { Component }   from 'react';
import {
  NavDropdown,
  MenuItem,
}                             from 'react-bootstrap';
import telemetryStore         from '../Stores/TelemetryStore';
// import _                      from 'underscore';
import {
  setCurrentSession
}                             from '../Actions/Actions';

import '../short.css';


export class ItemList extends Component {

  constructor(props) {
    super(props);
    this.state = {};

  }

  render() {

    const items       = this.state.items        || [];
    const itemType    = this.props.itemType     || ''; 
    const itemKeyName = this.props.itemKeyName  || '';

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

  componentDidMount() {
    telemetryStore.addChangeListener(this._onChange.bind(this));
  }

  _onItemChosen(eventKey, event) {
    const item = this.state.items[eventKey];
    // console.log(`onItemChosen ${eventKey}`, item);
    setCurrentSession(item);
  }

  _onChange() {
    const items = Array.prototype.slice.apply(telemetryStore.data[this.props.itemType]);
    this.setState({items})
  }

}

