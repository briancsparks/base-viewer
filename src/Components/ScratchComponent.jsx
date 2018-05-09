
import React, { Component }   from 'react';
import telemetryStore         from '../Stores/TelemetryStore';
import { format }             from 'd3-format';
import {
  TimeRange, TimeSeries
}                             from 'pondjs';

import {
  Resizable,
  ChartRow,
  ChartContainer,
  Brush,
  YAxis, LabelAxis,
  LineChart, ScatterChart,
  Charts,
  styler
}                             from 'react-timeseries-charts';
import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');

const styleColors = 'steelblue,red,teal,orange'.split(',');

const initialRange = new TimeRange([75 * 60 * 1000, 125 * 60 * 1000]);

const lineChartFormat     = format(".1f");
const byteCountFormat     = format(".1f");                // eslint-disable-line no-unused-vars

function defTimeSeries(name, obj) {
  return new TimeSeries({
    name,
    columns : ['time', 'it'],
    points  : [
      [_.now(), obj]
    ]
  });
}

const chartStyle = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#DDD",
  paddingTop: 10,
  marginBottom: 10
};

// const brushStyle = {
//   boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
//   background: "#FEFEFE",
//   paddingTop: 10
// };


export class ScratchComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timerange   : initialRange,
      brushrange  : null
    };

  }

  renderScatterCharts(timerange, chartsA, chartsB = {}) {

    const yLabelA = chartsA.yLabel;
    // const yLabelB = chartsB.yLabel;

    const eventType = chartsA.events[0].eventType;
    const deepKey   = chartsA.events[0].deepKey;

    const events = this.state.events;

    const defDeepKey      = _.last(deepKey.split('.'));
    const timeSeries      = events[eventType] || defTimeSeries(eventType, {[defDeepKey]:100});
    const seriesMax       = timeSeries.max(deepKey);
    const seriesAvg       = timeSeries.avg(deepKey);
    const seriesMin       = Math.min(timeSeries.min(deepKey), 0);

    const style = styler([                // eslint-disable-line no-unused-vars
      { key: deepKey, color: "steelblue", width: 1, opacity: 0.5 }
    ]);

    const scatterStyle = {
      [deepKey]: {
        normal: {
          fill: "steelblue",
          opacity: 0.8,
        },
        highlighted: {
          fill: "#a7c4dd",
          opacity: 1.0,
        },
        selected: {
          fill: "orange",
          opacity: 1.0,
        },
        muted: {
          fill: "grey",
          opacity: 0.5
        }
      }
    };

    const seriesSummaryValues = [
      { label: "Max", value: lineChartFormat(seriesMax) },
      { label: "Avg", value: lineChartFormat(seriesAvg) }
    ];

    const oneScatterChartA = function({eventType, deepKey}, n) {

//      const { eventType, deepKey } = chartsA.events[n];
      const defDeepKey      = _.last(deepKey.split('.'));
      const timeSeries      = events[eventType] || defTimeSeries(eventType, {[defDeepKey]:100});

      const myStyle = _.extend({}, scatterStyle, {[deepKey] : {normal:{fill: styleColors[n], opacity: 0.8}}});

      return (
        <ScatterChart axis={yLabelA+'yaxis'} key={n}
          series={timeSeries}
          columns={[deepKey]}
          style={myStyle}
        />
      );
    }

    console.log(`rendering scatter with timerange:`, timerange.toJSON());

    return(
      <ChartContainer timeRange={timerange}
        format="relative"
        trackerPosition={this.state.tracker}
        onTrackerChanged={this._handleTrackerChanged.bind(this)}
        enablePanZoom
        minTime={timeSeries.range().begin()}
        maxTime={timeSeries.range().end()}
        minDuration={1000 * 60 * 10}
        onTimeRangeChanged={this._handleTimeRangeChange.bind(this)}
        onChartResize={this._handleChartResize.bind(this)}
      >

        <ChartRow height="200" debug={false}>
          <LabelAxis id={yLabelA+"yaxis"}
            label={yLabelA}
            values={seriesSummaryValues}
            min={seriesMin}
            max={seriesMax}
            width={140}
            type="linear"
            format=",.1f"
          />
          <Charts>

            {_.map(chartsA.events, (event, n) => {
              return oneScatterChartA(event, n)
            })}
          </Charts>
        </ChartRow>
      </ChartContainer>
    );
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

    const brushrange  = this.state.brushrange || mwpUpEvents.range();
    const timerange   = this.state.timerange  || brushrange;

    console.log(`rendering:`, timerange.toJSON(), brushrange.toJSON());

    return (
      <div>

        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>

              {this.renderScatterCharts(brushrange, {
                yLabel : 'nn', events:[
                    {eventType:'snmp_found_printer_MDL', deepKey:"it.nodeNum"},
                    {eventType:'snmpblaster_found_printer_MDL', deepKey:"it.nodeNum"}
                ]
              })}

            </Resizable>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>

              {this.renderScatterCharts(brushrange, {
                yLabel : 'nn', events:[{eventType:'sentPacket', deepKey:"it.nodeNum"}]
              })}

            </Resizable>
          </div>
        </div>

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
                    timeRange={brushrange}
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
    }
  }

  _handleChartResize(width) {
    this.setState({ width });
  }

  _onItemChosen(eventKey, event) {
  }

  _onChange() {
    const sessionId = telemetryStore.data.currentSessionId || sg.firstKey(telemetryStore.data.telemetry);

    if (sessionId) {
      const events = telemetryStore.data.telemetry[sessionId];
      this.setState({events})
    }

  }

}

