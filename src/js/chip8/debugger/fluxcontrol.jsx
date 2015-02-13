//<FluxControl>
var
React = require('react');
module.exports = React.createClass({
    render : function() {
        return (
            <div className="control">
                <input type="file" id="file-input" onChange={this.props.fileHandler}/> Load program<br/>
                <button type="button" className="btn btn-default btn-sm" data-type="start" onClick={this.props.clickHandler}>Start</button> 
                <button type="button" className="btn btn-default btn-sm" data-type="pause" onClick={this.props.clickHandler}>Pause</button> 
                <button type="button" className="btn btn-default btn-sm" data-type="stop" onClick={this.props.clickHandler}>Stop</button> 
                <button type="button" className="btn btn-default btn-sm" data-type="step" onClick={this.props.clickHandler}>Step</button>
            </div>
        );
    }
});