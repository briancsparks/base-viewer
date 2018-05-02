
import React, { Component }   from 'react';
import {
  DropdownButton,
  MenuItem,
}                             from 'react-bootstrap';
import telemetryStore         from '../Stores/TelemetryStore';
import _                      from 'underscore';

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

    return (
      <DropdownButton
          bsStyle={'default'}
          title={`${itemType}`}
          key={1}
          id={`${itemType}-choice-button`}
      >
      {
        items.map((item, i) => (
          <MenuItem eventKey={i} key={i} >{item[itemKeyName]}</MenuItem>
        ))
      }
      </DropdownButton>
    );
  }

  componentDidMount() {
    telemetryStore.addChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    const items = Array.prototype.slice.apply(telemetryStore.data[this.props.itemType]);
    this.setState({items})
  }

}

