
import React                  from 'react';
import Reflux                 from 'reflux';
import TimeSeriesStore        from '../Stores/TimeSeriesStore';
import { format }             from 'd3-format';
import {
  TimeSeries
}                             from 'pondjs';

import {
  LabelAxis
}                             from 'react-timeseries-charts';
import { _ }                  from 'underscore';

const sg                      = require('sgsg/lite');
const deref                   = sg.deref;

// const styleColors = 'steelblue,red,teal,orange'.split(',');
// const initialRange = new TimeRange([75 * 60 * 1000, 125 * 60 * 1000]);

const lineChartFormat     = format(".1f");
const byteCountFormat     = format(".1f");                // eslint-disable-line no-unused-vars

export function IpTimeLabelAxis(props) {

  // constructor(props) {
  //   super(props);
  //   // this.state = {
  //   //   foo: 'bar'
  //   // };
  //   this.setState({ key: Math.random() });

  //   this.store = TimeSeriesStore;
  // }

  // render() {

    const self = {props};
    const events  = deref(self, 'props.charts.events');

    if (!events || events.length < 1) {
      return (
        <div />
      )
    }

    const yLabel = deref(self, 'props.charts.yLabel');

    const event1      = events[0];
    const deepKey     = event1.deepKey;
    const eventType   = event1.eventType;
  
    const defDeepKey      = _.last(deepKey.split('.'));
    const timeSeries      = deref(self.state, eventType) || defTimeSeries(eventType, {[defDeepKey]:100});
    const seriesMax       = timeSeries.max(deepKey) || 100;
    const seriesAvg       = timeSeries.avg(deepKey) || 50;
    const seriesMin       = Math.min(timeSeries.min(deepKey), 0);
  
    const seriesSummaryValues = [
      { label: "Max", value: lineChartFormat(seriesMax) },
      { label: "Avg", value: lineChartFormat(seriesAvg) }
    ];
  
    return (
      <LabelAxis id={`${yLabel}yaxis2`}
      label={`${yLabel}right`}
      values={seriesSummaryValues}
      min={seriesMin}
      max={seriesMax}
      width={140}
      type="linear"
      format=",.1f" />
    );
  // }

  // componentDidMount() {
  //   var i = 10;
  // }

}

function defTimeSeries(name, obj) {
  return new TimeSeries({
    name,
    columns : ['time', 'it'],
    points  : [
      [_.now(), obj]
    ]
  });
}

