import React, { Component } from "react";
import "argon-design-system-free/assets/css/argon.css";
import "./App.css";
import cq from "@fullstackio/cq/dist/cq.browser";

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
    return (
      <form className="code-box">
        <h4>Source code:</h4>
        <textarea
          className="form-control"
          id="exampleFormControlTextarea1"
          rows="30"
          placeholder="Paste your code here ..."
          value={this.props.code}
          onChange={this.props.onChange}
        />
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
    return (
      <div className={"output " + statusClass}>
        <h4>Output:</h4>
        <pre>{this.props.results.output}</pre>
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
    }
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

  runCq = async () => {
    console.log(
      "this.state.query, this.state.code: ",
      this.state.query,
      this.state.code
    );
    try {
      const results = await cq(this.state.code, this.state.query);
      console.log(results);
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
    return (
      <main className={"App " + this.props.className}>
        <Header />
        <section className="section section-lg pt-lg-0 bg-secondary">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10 pt-50">
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
                        />
                      </div>
                      <div className="col-md-6">
                        <Output results={this.state.results} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="pt-50">
                  <small className="text-muted">
                    cq is MIT licensed. See source.
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
