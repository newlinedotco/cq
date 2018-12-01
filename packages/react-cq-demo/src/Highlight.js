import React, { Component } from "react";
import $ from "jquery";
import "./jquery.highlight-within-textarea";
window.jQuery = window.$ = $;

class Highlight extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {}

  componentDidUpdate() {
    $(this.ref.current).highlightWithinTextarea("destroy");
    $(this.ref.current).highlightWithinTextarea({
      highlight: this.props.highlights
    });
  }

  render() {
    return (
      <textarea
        className="form-control"
        rows="30"
        placeholder="Paste your code here ..."
        value={this.props.value}
        onChange={this.props.onChange}
        ref={this.ref}
      />
    );
  }
}

export default Highlight;
