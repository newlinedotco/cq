/**
 * This file describes a React Switch component.  The idea is to have a radio
 * button that can pick between a payment method of CREDITCARD or BTC.
 *
 * Some queries you can try on this file are:
 * 
 * ```
 * # get the whole 'Simple' class
 * cq '.Simple' examples/Simple.jsx
 * 
 * # get the `render` function on the `Simple` class
 * cq '.Simple .render' examples/Simple.jsx
 *
 * # get the range between `renderName` and `render`, inclusive
 * cq '.Simple .renderName-.render' examples/Simple.jsx
 *
 * # get the range between `renderName` and `render`, plus context
 * cq 'context(.Simple .renderName-.render, 1, 1)' examples/Simple.jsx

 * # get the range upto render 
 * cq '.Simple-upto(.Simple .render)' examples/Simple.jsx
 * ```
 *
 */
import React from 'react';

const Simple = React.createClass({
  renderName() {
    return <div>Nate</div>
  },

  // here's the render function
  render() {
    return (
      <div>
        {this.renderName()}
      </div>
    )
  }
});

module.exports = Simple;
