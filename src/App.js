import React, { Component } from 'react';
import {
  Nav, Navbar, NavItem, Grid
}                             from 'react-bootstrap';

import { TopTabs } from './Components/TopTabsComponent';

import getSessionData       from './Drivers/GetSessionData';

// TODO: remove this
import telemetryStore       from './Stores/TelemetryStore';

import './short.css'
import './App.css';

class App extends Component {

  render() {
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
            <Nav pullRight>
              <NavItem eventKey={1} href="/foobar">Foo Bar</NavItem>
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
}

export default App;
