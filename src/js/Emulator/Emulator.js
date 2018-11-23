import React from "react";
import Chip8 from "./../Chip8/Chip8";

export default class Emulator extends React.Component {
    constructor(props) {
        super(props);

        this.chip8 = null;
    }

    handleLoadRom(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            this.chip8.loadProgram(reader.result);
        };
        reader.readAsArrayBuffer(file);
    }

    onClickStart(event) {
        this.chip8.start();
    }

    onClickReset(event) {
        this.chip8.reset();
    }

    componentDidMount() {
        this.chip8 = new Chip8({
            displayID: 'screen'
        });
    }

    render() {
        return <div style={{border: '1px solid'}}>
            <input type="file" id="romselector" onChange={(e) => this.handleLoadRom(e)}/>
            <canvas id="screen" width="320" height="160"></canvas>
            <div>
                <button className="btn btn-primary" onClick={(e) => this.onClickStart(e)}>Start</button>
                <button className="btn btn-default" disabled>Pause</button>
                <button className="btn btn-default" onClick={(e) => this.onClickReset(e)}>Reset</button>
            </div>
        </div>
    }
}