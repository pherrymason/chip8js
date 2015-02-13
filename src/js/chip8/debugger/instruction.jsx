//<Instruction>
var React = require('react');

module.exports = React.createClass({
    render: function() {
        var isCurrent = this.props.current==true? 'current':'';
        return (
            <tr className={isCurrent}>
                <td>{this.props.address}</td>
                <td>{this.props.opcode}</td>
                <td>{this.props.description}</td>
                <td>break</td>
            </tr>
        );
    }
});