
import React, { Component }   from 'react';
import telemetryStore         from '../Stores/TelemetryStore';
import {
  TimeRange
}                             from 'pondjs';

import {
  Resizable,
  ChartRow,
  ChartContainer,
  Brush,
  YAxis,
  LineChart,
  Charts,
  styler
}                             from 'react-timeseries-charts';

const sg                      = require('sgsg/lite');

const initialRange = new TimeRange([75 * 60 * 1000, 125 * 60 * 1000]);

export class ScratchComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timerange   : initialRange,
      brushrange  : initialRange
    };

  }

  render() {

    const events = this.state.events;

    if (!events || !events.mwpUp) {
      return (
        <span />
      );
    }

    const style = styler([
      { key: "it.loopNum", color: "steelblue", width: 1, opacity: 0.5 }
    ]);

    const brushStyle = {
      boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
      background: "#FEFEFE",
      paddingTop: 10
    };

    const mwpUpEvents       = events.mwpUp;
    const loopNumMax        = mwpUpEvents ? mwpUpEvents.max('it.loopNum') : 100;

    return (
      <div>
        <div className="row">
          <div className="col-md-12" style={brushStyle}>
            <Resizable>
              <ChartContainer
                  timeRange={mwpUpEvents.range()}
                  format="relative"
                  trackerPosition={this.state.tracker}
                >
                <ChartRow height="100" debug={false}>
                  <Brush
                    timeRange={this.state.brushrange}
                    allowSelectionClear
                    onTimeRangeChanged={this._handleTimeRangeChange.bind(this)}
                  />
                  <YAxis
                    id="axis1"
                    label="Loop Number"
                    min={0}
                    max={loopNumMax}
                    width={70}
                    type="linear"
                    format="d"
                  />
                  <Charts>
                    <LineChart axis="axis1"
                      series={mwpUpEvents}
                      columns={["it.loopNum"]}
                      style={style}
                      breakLine={false}
                    />
                  </Charts>
                </ChartRow>
              </ChartContainer>

            </Resizable>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    telemetryStore.addChangeListener(this._onChange.bind(this));
  }

  _handleTrackerChanged(tracker) {
    var state = {tracker};
    this.setState(state);
  }

  _handleTimeRangeChange(timerange) {
    if (timerange) {
      this.setState({ timerange, brushrange: timerange });
    } else {
      this.setState({ timerange: initialRange, brushrange: null });
    }
  }

  _onItemChosen(eventKey, event) {
  }

  _onChange() {
    const sessionId = sg.firstKey(telemetryStore.data.telemetry);

    if (sessionId) {
      const events = telemetryStore.data.telemetry[sessionId];
      this.setState({events})
    }

  }

}

