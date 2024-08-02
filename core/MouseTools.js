

export class MouseTool{
    constructor(name = "draw", color = "skyblue"){
        this.name = name;

        /// overides the MouseManager.snapMouseToGrid when false
        this.allowSnap = true;

        /// default color, used for aabb and other things
        this.color = color;

        /// controls if the MouseToolManage will render the selection aabb
        this.isSelection = true;

        /// is this tool performing its task right now (edited by the mousetoll functions)
        this.running = false;
    }
    update(){}
    onStart(){}
    onMove(){}
    onEnd(){}
    onCancel(){}
    onSwitchTo(){}
    onSwitchOut(){}
    
    /// a render funciotn can be added after creation. This will overrided the render funtion of the MouseToolManager
}

