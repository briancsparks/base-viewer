
import React                  from 'react';
import Reflux                 from 'reflux';
import TimeSeriesStore        from '../Stores/TimeSeriesStore';
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

import {
  ipTimeLabelAxis
}                             from './IpTimeParts';

const sg                      = require('sgsg/lite');
const deref                   = sg.deref;

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


export class IpAcrossTimeComponent extends Reflux.Component {

  constructor(props) {
    super(props);
    this.state = {
      timerange   : initialRange,
      brushrange  : null
    };

    this.store = TimeSeriesStore;
  }

  renderScatterCharts(timerange, chartsA_, chartsB = {}) {
    const self = this;

    const chartsA = _.isArray(chartsA_) ? chartsA_[0] : chartsA_;
    const chartsAx = sg.reduce(chartsA_, {events:[]}, (m, value, index) => {
      m = sg._extend(_.omit(value, 'events'), m);
      m.events = [...m.events, ...value.events];
      return m;
    });

    const yLabelA = chartsA.yLabel;
    // const yLabelB = chartsB.yLabel;

    const eventType = chartsA.events[0].eventType;
    const deepKey   = chartsA.events[0].deepKey;

    const defDeepKey      = _.last(deepKey.split('.'));
    const timeSeries      = deref(this.state, eventType) || defTimeSeries(eventType, {[defDeepKey]:100});
    const seriesMax       = timeSeries.max(deepKey) || 100;
    const seriesAvg       = timeSeries.avg(deepKey) || 50;
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

    const infoValues = () => {
      return [{
        label: "Fooadfafasf",
        value: "Barsdaafasdfs"
      }];
    };

    const seriesSummaryValues = [
        { label: "Max", value: lineChartFormat(seriesMax) },
        { label: "Avg", value: lineChartFormat(seriesAvg) }
      ];

    const needSecondLabelAxis = ((chartsA.events.length > 1) && (chartsA.events[1].deepKey !== deepKey));

    const oneScatterChartA = function({eventType, deepKey}, n) {

      const defDeepKey      = _.last(deepKey.split('.'));
      const timeSeries      = deref(self.state, eventType) || defTimeSeries(eventType, {[defDeepKey]:100});

      const myStyle = _.extend({}, scatterStyle, {[deepKey] : {normal:{fill: styleColors[n], opacity: 0.8}}});

      var axisLabel = yLabelA+'yaxis';
      if (n > 0 && needSecondLabelAxis) {
        axisLabel += '2';
      }

      return (
        <ScatterChart axis={axisLabel} key={n}
          series={timeSeries}
          columns={[deepKey]}
          style={myStyle}
          onMouseNear={self._handleMouseNear.bind(self)}
          info={infoValues()}
          infoHeight={40}
          infoWidth={110}
          infoStyle={{
            fill: 'black',
            color: '#DDD'
          }}
        />
      );
    }

    return(
      <ChartContainer timeRange={timerange}
        format="relative"
        trackerPosition={this.state.tracker}
        onTrackerChanged={this._handleTrackerChanged.bind(this)}
        minTime={timeSeries.range().begin()}
        maxTime={timeSeries.range().end()}
        minDuration={1000 * 60 * 10}
        onTimeRangeChanged={this._handleTimeRangeChange.bind(this)}
        onChartResize={this._handleChartResize.bind(this)}
      >

        <ChartRow height="100" debug={false}
          trackerInfoValues={infoValues()}
          trackerInfoHeight={40}
          trackerInfoWidth={110}
          trackerInfoStyle={{
            fill: 'black',
            color: '#DDD'
          }}
        >
          <LabelAxis id={yLabelA+"yaxis"}
            label={yLabelA}
            values={seriesSummaryValues}
            min={seriesMin}
            max={seriesMax}
            width={140}
            type="linear"
            format=",.1f" />

          {ipTimeLabelAxis({chart: chartsA_, state: self.state})}
          {/* <ipTimeLabelAxis charts={chartsA} /> */}

          <Charts>

            {_.map(chartsA.events, (event, n) => {
              return oneScatterChartA(event, n)
            })}
          </Charts>

          {/* {secondLabelAxis()} */}
          
        </ChartRow>
      </ChartContainer>
    );
  }

  render() {

    const mwpUpEvents       = deref(this.state, 'mwpUp');

    if (!mwpUpEvents) {
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

    const loopNumMax        = mwpUpEvents ? mwpUpEvents.max('it.loopNum') : 100;

    const fullTimeRange     = new TimeRange([this.state.firstTick, this.state.lastTick]);

    const brushrange  = this.state.brushrange || mwpUpEvents.range();

    return (
      <div>

        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>

              {this.renderScatterCharts(brushrange, [{
                yLabel : 'ipno', events:[
                    {eventType:'allWithIp',     deepKey:"it.nodeNum"}
                    // ,{eventType:'allWithoutIp',  deepKey:"it.tick"}
                ]
              }, {
                yLabel : 'tick', events:[
                    {eventType:'allWithoutIp',  deepKey:"it.tick"}
                ]
              }])}

            </Resizable>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>

              {this.renderScatterCharts(brushrange, [{
                yLabel : 'nn', events:[
                    {eventType:'snmp_found_printer_MDL', deepKey:"it.nodeNum"},
                    {eventType:'snmpblaster_found_printer_MDL', deepKey:"it.nodeNum"}
                ]
              }])}

            </Resizable>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>

              {this.renderScatterCharts(brushrange, [{
                yLabel : 'nn', events:[{eventType:'sentPacket', deepKey:"it.nodeNum"}]
              }])}

            </Resizable>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12" style={brushStyle}>
            <Resizable>
              <ChartContainer
                  timeRange={fullTimeRange}
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
  }

  _handleTrackerChanged(tracker) {
    var state = {tracker};
    this.setState(state);

    // if (tracker) {
    //   var ts;
    //   if ((ts = deref(this.state, 'events.allWithIp'))) {
    //     console.log(`allWithIp: `, ts.atTime(tracker).toJSON());
    //   }
  
    //   if ((ts = deref(this.state, 'events.allWithoutIp'))) {
    //     console.log(`allWithoutIp: `, ts.atTime(tracker).toJSON());
    //   }
    // }
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

  _handleMouseNear(stats) {
    if (sg.isnt(stats)) { return; }

    const {column, event} = stats;
    console.log(column, event.toJSON());
  }

}

