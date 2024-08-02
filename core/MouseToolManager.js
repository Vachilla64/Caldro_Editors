import { currentCamera, gridSize } from "../setup.js"
import { events, keyboard } from "../../Caldro/src/Caldro_Controls.js"
import { alpha, circle, rect, stCircle } from "../../Caldro/src/Caldro_Rendering.js"
import { classicAABB } from "../../Caldro/src/Caldro_ClassicPhysics.js"
import { place, snapCoordinatesToGrid } from "../../Caldro/src/Caldro_Utility_Functions.js"
import { vec2D } from "../../Caldro/src/Caldro_Vectors_and_Matrices.js"
import { cordShow } from "../../Caldro/src/Caldro_Renderers.js"

/// TODO:
///   Switch to class, 
///   Add camera property, remove currentCamera from imports  
///   Prevent frequent calls to camear.getPointer() by caching the mouse
///   Auto fire the mouse events to avoid haveing to do them in game code
export const MouseToolManager = {
    equippedTool: null,
    snapMouseToGrid: true,
    drawStartCords: new vec2D(0, 0),
    drawEndCords: new vec2D(0, 0),
    selectionAABB: new classicAABB(0, 0, 0),

    /// TODO; add constructor checks and other things line (tool.onStartToUse())
    setTool(mouseTool) {
        if (this.equippedTool !== mouseTool) {
            if (this.equippedTool) {
                this.equippedTool.onSwitchOut();
            }
            this.equippedTool = mouseTool
            this.equippedTool.onSwitchTo();
        }
    },

    /// update the current tool
    update() {
        this.snapMouseToGrid = true
        if (keyboard.isBeingPressed("alt"))
            this.snapMouseToGrid = false

        this.selectionAABB.containVectors(this.drawStartCords, this.drawEndCords)
        if (this.equippedTool) {

            /// overiade snapping if set to false
            if(!this.equippedTool.allowSnap)
                this.snapMouseToGrid = false;

            this.equippedTool.update()
        }
    },

    /// draw the current tool
    render() {
        let mouse = currentCamera.getPointer();
        if (!mouse) return;
        if (this.equippedTool) {
            if (this.equippedTool.render) {
                if (this.equippedTool.running) {
                    this.equippedTool.render(mouse);
                }
            } else {
                // default rendering for tools with no render function
                alpha(0.4)
                circle(mouse.x, mouse.y, 10 * (1 / currentCamera.zoom.x), "white")
                alpha(1)
                stCircle(mouse.x, mouse.y, 10 * (1 / currentCamera.zoom.x), "white", 2 * (1 / currentCamera.zoom.x))
                cordShow(mouse, "white", 10, 2, false, currentCamera)
            }
        }
    },

    /// on start of the mouse
    onStart() {
        let mouse = currentCamera.getPointer()
        if (this.snapMouseToGrid)
            this.drawStartCords = snapCoordinatesToGrid(mouse.x, mouse.y, gridSize)
        else
            place(this.drawStartCords, mouse)

        place(this.drawEndCords, this.drawStartCords)
        if (this.equippedTool)
            this.equippedTool.onStart(mouse)
    },

    /// on move of the mouse
    onMove() {
        let mouse = currentCamera.getPointer()
        if (this.snapMouseToGrid)
            this.drawEndCords = snapCoordinatesToGrid(mouse.x, mouse.y, gridSize)
        else
            place(this.drawEndCords, mouse)
        if (this.equippedTool)
            this.equippedTool.onMove(mouse)
    },

    // on end of the mouse
    onEnd() {
        let mouse = currentCamera.getPointer()
        if (this.equippedTool)
            this.equippedTool.onEnd(mouse)
    }

}

window.MouseToolManager = MouseToolManager