
import React, { Component }   from 'react';
import telemetryStore         from '../Stores/TelemetryStore';
import {
  Glyphicon,
  Button
}                             from 'react-bootstrap';

export class NetworkActivity extends Component {

  constructor(props) {
    super(props);
    this.state = {};

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

  componentDidMount() {
    telemetryStore.addChangeListener(this._onChange.bind(this));
  }

  _onItemChosen(eventKey, event) {
  }

  _onChange() {
    const items = {};
    this.setState({items})
  }

}

