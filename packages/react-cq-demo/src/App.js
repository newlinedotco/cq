import React, { Component } from "react";
import "./App.css";
import unified from "unified";
import reParse from "remark-parse";
import remark2react from "remark-react";
import remarkCq from "@fullstackio/remark-cq";

const render = (text, config = {}) =>
  unified()
    .use(reParse)
    .use(remarkCq, config)
    .use(remark2react)
    .processSync(text).contents;

class App extends Component {
  render() {
    const markdown = `
# Welcome!

Hi, *mom*.

{lang=javascript,crop-query=.dogs}  
<<[](test.js)
    `;

    return (
      <div className="App">
        <header className="App-header">
          <p>{render(markdown)}</p>
        </header>
      </div>
    );
  }
}

export default App;
