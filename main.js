import Caldro from "../Caldro/src/Caldro.js";
import { adjustCanvas } from "../Caldro/src/Caldro_Rendering.js";
import { cloneObject, cloneObjectPreserveDestination } from "../Caldro/src/Caldro_Serialization.js";
import { SETUP_DEBUG } from "../Caldro/src/debug/Caldro_Debug.js";
import { SETUP } from "./setup.js";

Caldro.init();
adjustCanvas();

SETUP();
SETUP_DEBUG();

Caldro.start();


window.onresize = () => {
    adjustCanvas();
}

window.Caldro = Caldro

let robert = {
    name: "robert",
    sayHi(){
        console.log(this.name)
    }
}
let nancy = {}
cloneObjectPreserveDestination(nancy, robert)
// nancy.name = "nancy"
// nancy.sayHi()
console.log(nancy, CaldroKeys)
console.log(nancy.__proto__)