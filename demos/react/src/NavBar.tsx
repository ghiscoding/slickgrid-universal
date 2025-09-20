import React from 'react';

import ReactLogo from './assets/react-logo.png?url';

export class NavBar extends React.Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
          <a className="navbar-brand ms-2" href="https://github.com/ghiscoding/slickgrid-react">
            <i className="mdi mdi-github"></i>
            <span className="ms-2">Slickgrid-React</span>
          </a>
          <img src={ReactLogo} className="logo" height="38" />
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="github-button-container">
            <a href="https://github.com/ghiscoding/slickgrid-universal">
              <img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social" />
            </a>
          </div>

          <div className="navbar-collapse collapse justify-content-end me-2" id="navbarContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <a className="nav-link" href="/#home">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-react/" target="_blank">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    );
  }
}
