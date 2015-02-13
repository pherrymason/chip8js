//<Memory>
var
React = require('react'),
_       = require('underscore');
module.exports = React.createClass({
    getInitialState: function() {
        return {V:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],I:0,timerDelay:0, timerSound:0};
    },
    render : function() {

        var Vs = _.map( this.state.V, function (v,idx) {
            return (
                <li key={'v'+idx}><b>V{idx.toString(16).toUpperCase()}</b> <span>0x{v.toString(16).toUpperCase()}</span></li>
            );
        });

        return (
            <div className="memoryViewer">
                <h4>Registers</h4>
                <ul className="registers">
                    <li><b>Timer Delay:</b> <span className="timer-delay">{this.timerDelay}</span></li>
                    <li><b>Sound Delay:</b> <span className="sound-delay">{this.soundDelay}</span></li>
                    <li><b>I</b> <span className="I">0x{this.state.I.toString(16).toUpperCase()}</span></li>
                    {Vs}
                </ul>
            </div>
        );
    }
});