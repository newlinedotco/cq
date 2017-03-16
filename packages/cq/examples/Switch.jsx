/**
 * This file describes a React Switch component.  The idea is to have a radio
 * button that can pick between a payment method of CREDITCARD or BTC.
 *
 * Some queries you can try on this file are:
 * 
 * ```
 * cq '.CREDITCARD' examples/Switch.jsx
 * cq '.Switch' examples/Switch.jsx
 * cq '.Switch .select' examples/Switch.jsx
 * cq '.Switch .select-.render' examples/Switch.jsx
 * cq 'context(.Switch .select, 2, 2)' examples/Switch.jsx
 * cq 'context(.Switch .select-.render, 4, 4)' examples/Switch.jsx
 * cq  --gapFiller "\n  //...\n" 'window(.Switch, 0, 0), .renderChoice, window(.Switch, 0, 0, true)' ./examples/Switch.jsx
 * ```
 *
 * Fwiw, this partifular component is an excerpt from the book "Fullstack React".
 */
import React, { PropTypes } from 'react';

const CREDITCARD = 'Creditcard';
const BTC = 'Bitcoin';

const Switch = React.createClass({
  getInitialState() {
    return {
      payMethod: BTC
    };
  },

  select(choice) {
    return (evt) => {
      this.setState({
        payMethod: choice
      })
    }
  },

  renderChoice(choice) {
    return (
      <div className="choice"
           onClick={this.select(choice)}>
        {choice}
      </div>
    )
  },

  render() {
    return (
      <div className="switch">
        {this.renderChoice(CREDITCARD)}
        {this.renderChoice(BTC)}
        Pay with: {this.state.payMethod}
      </div>
    )
  }
});

module.exports = Switch;
