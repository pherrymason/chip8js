//<Assembler>
var
React               = require('react'),
InstructionList     = require('./instructionlist.jsx');

module.exports = React.createClass({
    getInitialState: function() {
        return {data:[], current:0};
    },

    render : function() {
        return (
            <table className="assembler">
                <thead>
                    <tr>
                        <th>@</th>
                        <th>Instruction</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <InstructionList data={this.state.data}/>
            </table>
        );
    }
});