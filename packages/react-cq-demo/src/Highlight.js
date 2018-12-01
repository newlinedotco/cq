import React, { Component } from "react";
import $ from "jquery";
import "./jquery.highlight-within-textarea";
import debounce from "lodash/debounce";
window.jQuery = window.$ = $;

class Highlight extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = { inputText: "" };

    this.handleChange = this.handleChange.bind(this);
    this._updateHighlights = this.updateHighlights.bind(this);
    this.updateHighlights = this._updateHighlights;

    // debounce
    //this.updateHighlights = debounce(this._updateHighlights, 500);
  }

  handleChange(e) {
    this.setState({ inputText: e.target.value }, () => this.updateHighlights());
  }

  updateHighlights() {
    $(this.ref.current).highlightWithinTextarea("destroy");
    $(this.ref.current).highlightWithinTextarea({
      highlight: this.props.highlights
    });
  }

  // TODO https://github.com/facebook/react/issues/1360#issuecomment-333969294
  componentDidUpdate(prevProps) {
    // $(this.ref.current).highlightWithinTextarea("destroy");
    // $(this.ref.current).highlightWithinTextarea({
    //   highlight: this.props.highlights
    // });

    const { value } = this.props;
    const self = this;
    if (prevProps.value !== value && this.state.inputText !== value) {
      this.setState({ inputText: value }, () => {
        self.updateHighlights();
      });
    }
  }

  componentDidMount() {
    // this._updateHighlights();
  }

  render() {
    return (
      <textarea
        className="form-control"
        rows={this.props.rows}
        placeholder="Paste your code here ..."
        value={this.state.inputText}
        onChange={this.props.onChange}
        ref={this.ref}
      />
    );
  }
}

export default Highlight;
