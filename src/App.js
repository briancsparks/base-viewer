
import React                  from 'react';
import Reflux                 from 'reflux';
import {
  Nav, Navbar, NavItem, NavDropdown, Grid, MenuItem
}                             from 'react-bootstrap';
import {
  ItemList
}                             from './Components/ItemList';
import {
  NetworkActivity
}                             from './Components/NetworkActivity';

import { TopTabs }            from './Components/TopTabsComponent';
import {
  DebugActions
}                             from './Actions/Actions';

import getSessionData         from './Drivers/GetSessionData';
import RawTelemetryStore      from './Stores/RawTelemetryStore';

import './short.css'
import './App.css';

const sg                      = require('sgsg/lite');

const deref                   = sg.deref;

const {
  showDataTypesInConsole
} = DebugActions;


class App extends Reflux.Component {

  constructor(props) {
    super(props);
    this.store = RawTelemetryStore;
  }

  render() {

    const sessionId       = deref(this.state, 'sessionId')                || '';
    const sessionsCount   = deref(this.state, 'sessions.length')          || 0;
    const clientsCount    = deref(this.state, 'clients.length')           || 0;

    const onSelectAction    = this._onItemChosen.bind(this);

    return (
      <div className="App">
        <Navbar inverse fluid fixedTop>

          {/* Header and Brand */}
          <Navbar.Header>
            <Navbar.Brand>
              <a href="/">Netlab Telemetry Viewer</a>
            </Navbar.Brand>

          </Navbar.Header>

          <Navbar.Collapse>

            <Nav>
              <NavDropdown eventKey={1} title="Actions" id="action-dropdown">
                <MenuItem eventKey={1.1} onSelect={onSelectAction}>Show Data Types in Console</MenuItem>
              </NavDropdown>

              <NavItem>
                <Navbar.Text>
                  {`${clientsCount} / ${sessionsCount}`}
                </Navbar.Text>
              </NavItem>

              <ItemList itemType="clients"  itemKeyName="clientId" />
              <ItemList itemType="sessions" itemKeyName="sessionId" />

              <NavItem>
                <Navbar.Text pullRight>
                  {`${sessionId}`}
                </Navbar.Text>
              </NavItem>
            </Nav>

            <Nav pullRight>
              <NetworkActivity />
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        {/* Main Content Area */}
        <div>
          <Grid fluid={true}>
            <TopTabs>
            </TopTabs>

          </Grid>
        </div>

      </div>
    );
  }

  componentDidMount() {
    getSessionData();
  }

  _onItemChosen(eventKey, event) {
    if (eventKey === 1.1) {
      showDataTypesInConsole();
    }
  }

}

export default App;
