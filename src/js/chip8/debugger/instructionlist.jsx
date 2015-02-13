var
React       = require('react'),
Instruction = require('./instruction.jsx');

module.exports = InstructionList = React.createClass({
    render: function() {

        var instructionNodes = this.props.data.map(function (opcodeD) {
            return (
                <Instruction key={opcodeD.address} address={opcodeD.address} opcode={opcodeD.opcode} description={opcodeD.description} current={opcodeD.current}/>
            );
        });


        return (
            <tbody>
            {instructionNodes}
            </tbody>
        );
    }
});