
import React                  from 'react';
import Reflux                 from 'reflux';
import RawTelemetryStore      from '../Stores/RawTelemetryStore';
import {
  Glyphicon,
  Button
}                             from 'react-bootstrap';

export class NetworkActivity extends Reflux.Component {

  constructor(props) {
    super(props);
    this.store = RawTelemetryStore;
  }

  render() {
    return (
      <Button>
        <Glyphicon glyph="refresh">
          5
        </Glyphicon>
      </Button>
    );
  }

  // componentDidMount() {
  //   telemetryStore.addChangeListener(this._onChange.bind(this));
  // }

  _onItemChosen(eventKey, event) {
  }

  // _onChange() {
  //   const items = {};
  //   this.setState({items})
  // }

}

