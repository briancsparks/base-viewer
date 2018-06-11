
import React                  from 'react';
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


export function ipTimeLabelAxis({chart, state, secondary=false}) {

  var   result = _.compact(_.map(chart, (item, index) => {

    const itemSecondary = !!item.secondary;
    if (itemSecondary !== secondary) { return null; }

    const {events, yLabel} = item;

    if (!events || events.length < 1) {
      return (
        <div />
      )
    }

    var seriesMax = -1;
    var seriesAvg = -1;
    var seriesMin = 999999999;

    _.each(events, event => {
      const deepKey     = event.deepKey;
      const eventType   = event.eventType;
    
      const defDeepKey      = _.last(deepKey.split('.'));
      const timeSeries      = deref(state, eventType) || defTimeSeries(eventType, {[defDeepKey]:100});

      seriesMax             = Math.max(seriesMax, timeSeries.max(deepKey) || 100);
      seriesAvg             = timeSeries.avg(deepKey) || 50;
      seriesMin             = Math.min(seriesMin, timeSeries.min(deepKey));

    });
  
    const seriesSummaryValues = [];
    seriesSummaryValues.push({ label: "Max", value: lineChartFormat(seriesMax) });

    if (events.length <= 1) {
      seriesSummaryValues.push({ label: "Avg", value: lineChartFormat(seriesAvg) });
    }
    
    seriesSummaryValues.push({ label: "Min", value: lineChartFormat(seriesMin) });

    const axisId = `${yLabel}yaxis${index}`;
  
    return (
      <LabelAxis id={axisId}
      label={`${yLabel}`}
      key={index}
      values={seriesSummaryValues}
      min={seriesMin}
      max={seriesMax}
      width={140}
      type="linear"
      format=",.1f" />
    );
  }));

  return result;

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

