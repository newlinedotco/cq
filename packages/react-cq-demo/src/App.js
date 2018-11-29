import React, { Component } from "react";
import "./App.css";
import remark from "remark";
import remark2react from "remark-react";

class App extends Component {
  render() {
    const markdown = `
# Welcome!

Hi, *mom*.
    `;
    return (
      <div className="App">
        <header className="App-header">
          <p>
            {
              remark()
                .use(remark2react)
                .processSync(markdown).contents
            }
          </p>
        </header>
      </div>
    );
  }
}

export default App;
