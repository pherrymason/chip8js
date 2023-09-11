

var
$           = require('jquery'),
Backbone    = require('backbone'),
_           = require('underscore'),
React       = require('react'),
Assembler   = require('./debugger/assembler.jsx'),
FluxControl = require('./debugger/fluxcontrol.jsx'),
Memory      = require('./debugger/memory.jsx'),
Debugger    = function(debugID){
    var
    db = this,
    Wrapper = React.createClass({
        render: function() {
            return (
                <div className="debugger">
                    <FluxControl ref="controls" clickHandler={db.onClick.bind(db)} fileHandler={db.onFileSelected.bind(db)}/>
                    <Assembler ref="assembler"/>
                    <Memory ref="memory"/>
                </div>
            );
        }
    });

    this.component = React.render(
        <Wrapper/>,
        document.getElementById(debugID)
    );
    
    this.memory = null;
};

Backbone.$ = $;
Debugger.prototype = _.extend(Debugger.prototype,Backbone.Events);

Debugger.prototype.updateAssembler = function(programCounter,I){

    var
    range   = 10,
    halfRange = range/2,
    start   = (programCounter - halfRange*2 ) < 0? 0:programCounter - halfRange*2,
    end     = (programCounter + halfRange*2 ) > this.memory.length? this.memory.length-1:programCounter+halfRange,
    memorySlice = [],
    that    = this;

    for (var i=start; i<end; i++) {
        var opcode = this.memory[i] << 8;
        i++;
        opcode |= this.memory[i];
        memorySlice.push({
            address     : that.hex(i-1),
            opcode      : that.hex(opcode),
            description : that.opcodeDescription(opcode,I),
            current     : ((i-1)==programCounter)
        });
    }

    this.component.refs.assembler.setState({data:memorySlice, current:programCounter});
};



Debugger.prototype.updateMemory = function(V,I,timerDelay,timerSound) {
    this.component.refs.memory.setState({V:V,I:I,timerDelay:timerDelay,timerSound:timerSound});
};



Debugger.prototype.hex = function(num, pad) {
    num = num.toString(16).toUpperCase();
    if (pad) {
        var s = num + "";
        while (s.length < pad) {
            s = "0" + s;
        }
        return '0x'+s;
    }

    return '0x'+num;
};

Debugger.prototype.opcodeDescription = function(opcode,I){

    var
    x   = (opcode & 0x0F00) >> 8,
    y   = (opcode & 0x00F0) >> 4,
    nnn = opcode & 0x0FFF,
    kk  = opcode & 0x00FF,
    n   = opcode & 0x000F,
    // Formated operands
    xHex   = this.hex(x),
    yHex   = this.hex(y),
    nnnHex = this.hex(nnn, 3),
    kkHex  = this.hex(kk, 2),
    nHex   = this.hex(n & 0x000F, 1),
    IHex    = this.hex(I, 1);

    switch (opcode & 0xf000)
    {
        case 0x0000:
            switch (opcode)
            {
                case 0x00E0:
                    return "00E0 - Clear the display";
                case 0x00EE:
                    return "00E0 - Return from a subroutine";
            }
            return null

        case 0x1000:
            if (nnn < 0x200){
                return null;
            }
            return "1nnn - Jump to address " + nnnHex;

        case 0x2000:
            if (nnn < 0x200) {
                return null;
            }
            return "2nnn - Call subroutine at " + nnnHex;
        case 0x3000:
            return "3xkk - Skip next instruction if V" + xHex + " = " + kkHex;
        case 0x4000:
            return "4xkk - Skip next instruction if V" + xHex + " != " + kkHex;
        case 0x6000:
            return "6xkk - Set V" + xHex + " = " + kkHex;
        case 0x7000:
            return "7xkk - Set V" + xHex + " = V" + xHex + " + " + kkHex;

        case 0x8000:
                    switch( opcode&0x000F )
                    {
                        case 0: return 'Sets V['+xHex+'] to V['+yHex+']';
    
                        case 1: return 'Sets V['+xHex+'] to "V['+xHex+'] OR V['+yHex+']"';
        
                        case 2: return 'Sets V['+xHex+'] to "V['+xHex+'] AND V['+yHex+']"';

                        case 3: return 'Sets V['+xHex+'] to "V['+xHex+'] xHexOR V['+yHex+']"';

                        case 4: return 'Add V['+xHex+'] to V['+yHex+']. VF carries';

                        case 5: return 'Substracts V['+xHex+'] - V['+yHex+']. VF borrows';

                        case 6: return 'Shifts V['+xHex+']>>1. VF.';

                        case 7: return 'Sets V['+xHex+'] = V['+yHex+']-V['+xHex+']. VF borrows.';

                        case 0x0E:  return 'Shifts V['+xHex+']<<1. VF.';
                    }
                    break;

        case 0xa000:
            if (nnn < 0x200){
                return null;
            }
            return "Annn - Set I = " + nnnHex;
        case 0xc000:
            return "Cxkk - Set V" + xHex + " = random byte AND " + kkHex;
        case 0xd000:
            return "Dxyn - Draw sprite in I..I+" + n + " at (V" + xHex + ",V" + yHex + ")";

        case 0xE000:
            switch (opcode & 0x0FF) {
                case 0x9E: 
                    return "E09E - Skips the next instruction if the key stored in V"+xHex+" is pressed.";

                case 0xA1:
                    return "E0A1 - Skips the next instruction if the key stored in V"+xHex+" is not pressed.";
            }
            break;


        case 0xF000:
            switch (opcode & 0x00FF) {
                case 0xF01E:
                    return "Fx1E - Set I = I + V" + xHex;

                case 0x07:
                    return 'sets V[X] the value of timer delay.';

                case 0x0A:
                    return 'Waits for keypress.';

                case 0x15:
                        return 'Sets the delay timer to V[X].';

                case 0x18:
                        return 'Sets the sound timer to V[X].';

                case 0x1E:
                        return 'Adds V[X] to I.';

                case 0x29:
                        return 'Sets I to the location of the sprite.';

                case 0x33:
                        return 'Stores binary coded decimal';

                case 0x55:
                        return 'Fills V[0] to V['+xHex+'] in memory from '+IHex;

                case 0x65:
                        return 'Fills V[0] to V['+xHex+'] with memory from '+IHex;
            }
            return null;

        default:
            return null;
    }
};



// Component events
Debugger.prototype.configureEvents = function() {
//    this.
};


Debugger.prototype.onClick = function(event) {

    var $btn = $(event.nativeEvent.target);
    switch ($btn.data('type')) {
        case 'start':
                    this.trigger('start');
                    break;

        case 'stop':
                    this.trigger('stop');
                    break;

        case 'pause':
                    this.trigger('pause');
                    break;

        case 'step':
                    this.trigger('step');
                    break;
    }
};



Debugger.prototype.onFileSelected = function(event) {
    var file = event.nativeEvent.target.files[0];
    if (!file) {
        return;
    }

    var
    that = this,
    reader = new FileReader();
    reader.onload = function(e){
        that.trigger('programLoaded', new Uint8Array(e.target.result));
    };
    reader.readAsArrayBuffer(file);
};


module.exports = Debugger;