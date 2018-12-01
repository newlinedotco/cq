import React, { Component } from "react";
import "./argon.css";
import "./App.css";
import cq from "@fullstackio/cq/dist/cq.browser";
import examples from "./examples";
import keyBy from "lodash/keyBy";
import get from "lodash/get";
// import Highlight from "./Highlight";

const examplesIdx = keyBy(examples, "name");

class Header extends Component {
  render() {
    return (
      <div className="position-relative">
        <section className="section section-md section-shaped section-header">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h1 className="display-3 text-white">cq</h1>
                <p className="lead text-white">
                  cq helps you semantically extract code snippets using CSS-like
                  selectors
                </p>
              </div>
              <div className="col-md-6 header-text">
                <p>
                  <small>
                    <a href="https://github.com/fullstackio/cq">
                      Documentation on GitHub
                    </a>
                  </small>
                </p>
              </div>
            </div>
          </div>
          <div className="shape shape-style-1 shape-default" />
        </section>
      </div>
    );
  }
}

class CodeBox extends Component {
  render() {
    // const highlights = () =>
    //   this.props.startChar &&
    //   this.props.endChar &&
    //   this.props.startChar > 0 &&
    //   this.props.status === "success"
    //     ? [[this.props.startChar, this.props.endChar]]
    //     : [];

    return (
      <form className="code-box">
        <h4>Source code:</h4>
        {/*
        <Highlight
          value={this.props.code}
          onChange={this.props.onChange}
          highlights={highlights}
          rows={30}
        />
       */}
        <textarea
          className="form-control"
          rows="30"
          placeholder="Paste your code here ..."
          value={this.props.code}
          onChange={this.props.onChange}
        />
        <div className="hidden">
          {this.props.startChar}
          {this.props.endChar}
        </div>
      </form>
    );
  }
}

class QueryBox extends Component {
  render() {
    return (
      <div className="query-box form-group">
        <h4>Query:</h4>
        <div className="input-group mb-4">
          <input
            className="form-control"
            placeholder="Selector"
            type="text"
            value={this.props.query}
            onChange={this.props.onChange}
          />
        </div>
      </div>
    );
  }
}

class Output extends Component {
  render() {
    const statusClass = this.props.results.status;
    let locations = <div />;
    if (statusClass === "success") {
      const { start, end, start_line, end_line } = this.props.results.results;
      locations = (
        <div className="locations text-muted">
          Lines: {start_line}-{end_line} Chars: {start}-{end}
        </div>
      );
    }
    return (
      <div className={"output " + statusClass}>
        <h4>Output:</h4>
        <pre>{this.props.results.output}</pre>
        {locations}
      </div>
    );
  }
}

class ExampleSelectionBox extends Component {
  render() {
    const options = examples.map(example => (
      <option key={example.name} value={example.name}>
        {example.name}
      </option>
    ));

    return (
      <div className="query-box form-group">
        <h4>Examples:</h4>
        <div className="input-group mb-4">
          <select
            className="form-control"
            value={this.props.example}
            onChange={this.props.onChange}
          >
            <option>Select an example...</option>
            {options}
          </select>
        </div>
        <div>
          <small className="text-muted">
            For more examples,{" "}
            <a href="https://github.com/fullstackio/cq">
              see the documentation
            </a>
          </small>
        </div>
      </div>
    );
  }
}

class App extends Component {
  state = {
    query: "",
    code: "",
    results: {
      status: "clean",
      results: null,
      output: ""
    },
    example: ""
  };

  componentDidMount() {
    this.setState({ query: ".a", code: "var a = 1;" }, () => this.runCq());
  }

  onQueryChange = evt => {
    this.setState({ query: evt.target.value }, () => this.runCq());
  };

  onCodeChange = evt => {
    this.setState({ code: evt.target.value }, () => this.runCq());
  };

  onExampleChange = evt => {
    const example = evt.target.value;
    const { code, query } = examplesIdx[example];
    this.setState({ code, query, example }, () => this.runCq());
  };

  runCq = async () => {
    try {
      // here
      const results = await cq(this.state.code, this.state.query, {
        undent: true
      });
      this.setState({
        results: {
          status: "success",
          results,
          output: results.code
        }
      });
    } catch (err) {
      console.warn(err);
      this.setState({
        results: {
          status: "error",
          error: err,
          output: `${err.name}: ${err.message}`
        }
      });
    }
  };

  render() {
    const startChar = get(this.state, "results.results.start", -1);
    const endChar = get(this.state, "results.results.end", -1);
    const status = get(this.state, "results.status");

    return (
      <main className={"App " + this.props.className}>
        <Header />
        <section className="section section-lg pt-lg-0 bg-secondary">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-12 pt-50">
                <div className="main-card card shadow border-0">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <QueryBox
                          query={this.state.query}
                          onChange={this.onQueryChange}
                        />
                        <CodeBox
                          code={this.state.code}
                          onChange={this.onCodeChange}
                          startChar={startChar}
                          endChar={endChar}
                          status={status}
                        />
                      </div>
                      <div className="col-md-6">
                        <Output results={this.state.results} />
                        <ExampleSelectionBox
                          onChange={this.onExampleChange}
                          example={this.state.example}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="pt-50 site-info">
                  <small className="text-muted">
                    cq is MIT licensed. See{" "}
                    <a href="https://github.com/fullstackio/cq">source</a>.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
}

export default App;
