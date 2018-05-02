import React, { Component } from 'react';
import {
  Nav, Navbar, NavItem, Grid, Tabs, Tab
}                             from 'react-bootstrap';

import logo from './logo.svg';
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

            <div>
              <Tabs activeKey={1} id="top-tabs">
                <Tab eventKey={1} title="Scratch">
                  A tab
                </Tab>
              </Tabs>
            </div>

          </Grid>
        </div>

      </div>
    );
  }
}

export default App;
