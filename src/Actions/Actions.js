
import Reflux                 from 'reflux';

export const Actions = Reflux.createActions(['addSessions', 'addClients', 'setCurrentSession', 'setCurrentSessionEz', 'setCurrentSessionId', 'setCurrentClient']);
export const RawTimeSeriesActions = Reflux.createActions(['addRawTimeSeriesData', 'addRawTimeSeriesFeedData']);
export const TimeSeriesActions = Reflux.createActions(['addTimeSeriesData', 'addTimeSeriesFeedData']);
export const DebugActions = Reflux.createActions(['showDataTypesInConsole']);

export const sessionInfoRequestId = 'sessionInfoRequestId';

