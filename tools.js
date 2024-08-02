import { MouseTool } from "./core/MouseTools.js"
import { world, physics, currentCamera, devCamera } from "./setup"
import { events, keyboard, KeyShortCutHandler } from "../Caldro/src/Caldro_Controls"
import { MouseToolManager } from "./core/MouseToolManager.js"
import { alpha, circle, drawPolypon, drawVerticiesAsPath, line, Rect, rect } from "../Caldro/src/Caldro_Rendering.js"
import { vec2D, vecMath } from "../Caldro/src/Caldro_Vectors_and_Matrices.js"
import { cordShow } from "../Caldro/src/Caldro_Renderers.js"
import { angleBetweenPoints } from "../Caldro/src/Caldro_Physics_Utilities.js"
import { dist2D, generateRandomId, place } from "../Caldro/src/Caldro_Utility_Functions.js"
import { classicPhysics, Collisions } from "../Caldro/src/Caldro_ClassicPhysics.js"
import { scaleTo } from "../Caldro/src/Caldro_Math.js"
import Caldro, { CaldroKeys } from "../Caldro/src/Caldro.js"
import { CURSOR_TYPES } from "../Caldro/src/Caldro_Utility_Constants.js"
import { cloneObject, cloneObjectPreserveDestination } from "../Caldro/src/Caldro_Serialization.js"


export const drawBoxBodyTool = new MouseTool("draw box body", "lightblue")
drawBoxBodyTool.update = function () {
    /// setting the colors of the selection AABB depending on the funciotn it carries out
    drawBoxBodyTool.color = "skyblue"
    if (keyboard.isBeingPressed("alt"))
        drawBoxBodyTool.color = "red"
    else if (keyboard.isBeingPressed("shift"))
        drawBoxBodyTool.color = "blue"
}
drawBoxBodyTool.onStart = function () {
    this.running = true;
}
/// TODO: change world.getBodies to Collisions.collide
drawBoxBodyTool.onEnd = function () {
    this.running = false;
    if (keyboard.isBeingPressed("alt")) {
        let bodies = world.getBodiesInAABB(MouseToolManager.selectionAABB)
        for (let body of bodies) {
            body.tag = "toBeDeleted"
        }
        world.removeBodiesWithTag("toBeDeleted")
        return;
    }
    let dimensions = MouseToolManager.selectionAABB.getDimensions();
    if (dimensions.width == 0 || dimensions.height == 0) return
    let body = physics.createBoxBody(dimensions.center, dimensions.width, dimensions.height, 0.4, 1, keyboard.isBeingPressed("shift"))
    world.addBody(body)
}
drawBoxBodyTool.render = function (mouse) {
    let selectionDimensions = MouseToolManager.selectionAABB.getDimensions()
    alpha(0.4)
    rect(selectionDimensions.left, selectionDimensions.top, selectionDimensions.width, selectionDimensions.height, this.color)
    alpha(1)
}



export const drawCircleBodyTool = new MouseTool("Draw Circle Body", "lightblue");
drawCircleBodyTool.update = function () {
    this.color = "lightblue"
    if (keyboard.isBeingPressed("shift"))
        this.color = "blue"
}
drawCircleBodyTool.onStart = function (mouse) {
    this.running = true
}
drawCircleBodyTool.onEnd = function () {
    this.running = false
    let center = vecMath.copy(MouseToolManager.drawStartCords);
    let radius = vecMath.distance(center, MouseToolManager.drawEndCords)
    if (radius == 0) return;
    let angle = angleBetweenPoints(center, MouseToolManager.drawEndCords)
    let body = physics.createCircleBody(center, radius, 0.2, 1, keyboard.isBeingPressed("shift"))
    body.rotate(angle)
    world.addBody(body)
}
drawCircleBodyTool.render = function () {
    let center = MouseToolManager.drawStartCords;
    let radius = vecMath.distance(center, MouseToolManager.drawEndCords)
    alpha(0.4)
    circle(center.x, center.y, radius, this.color)
    alpha(1)
    line(MouseToolManager.drawEndCords.x, MouseToolManager.drawEndCords.y, center.x, center.y, "white", 2 * (1 / currentCamera.zoom.x))
    cordShow(center, "white", 10, 2, false, currentCamera)
    cordShow(MouseToolManager.drawStartCords, "white", 10, 2, false, currentCamera)
}



export const drawPolyponBodyTool = new MouseTool("Draw Polygon Body", "lightblue")
drawPolyponBodyTool.data = {
    verticies: []
}
drawPolyponBodyTool.update = function (mouse) {
    this.color = "lightblue"
    if (keyboard.isBeingPressed("shift"))
        this.color = "blue"

    let verticies = this.data.verticies

    /// can only draw while spacebar is helo down
    if (keyboard.isBeingPressed("ctrl")) {
        this.running = true

    } else {
        if (this.running) {
            if (verticies.length > 2) {
                let center = Collisions.findArithmeticMeanPoint(verticies)
                verticies = classicPhysics.centerVerticies(verticies)
                let body = physics.createPolygonBody(center, verticies, 1, 1, 0.1, 1, keyboard.isBeingPressed("shift"))
                world.addBody(body)
                console.log(body)
            }
            verticies.length = 0
            this.running = false
        } else {
            verticies.length = 0
        }
    }

}
drawPolyponBodyTool.onStart = function () {
    let verticies = this.data.verticies
    let snappedMouse = MouseToolManager.drawEndCords


    /// add another vertex, this will be moved by the onMove enet
    verticies.push(vecMath.copy(snappedMouse))
}
drawPolyponBodyTool.onMove = function () {
}
drawPolyponBodyTool.render = function () {
    let verticies = drawPolyponBodyTool.data.verticies
    let snappedMouse = MouseToolManager.drawEndCords
    if (verticies.length == 0) return
    for (let verttex of verticies) {
        cordShow(verttex, "white", 10, 2, false, currentCamera)
    }

    /// draw a line from the last added vertex to the current snapped mouse position
    let lastVertex = verticies[verticies.length - 1]
    line(lastVertex.x, lastVertex.y, snappedMouse.x, snappedMouse.y, "white", 2 * (1 / currentCamera.zoom.x))
    drawVerticiesAsPath(verticies, this.color, 2 * (1 / currentCamera.zoom.x))
}



export const bodyClickSelectorTool = new MouseTool("Click to select a body")
bodyClickSelectorTool.data = {
    selectedBody: null,
    previousMouseCursor: null
}
bodyClickSelectorTool.update = function () {
    if (!events.mouseIsDown) return
}
bodyClickSelectorTool.onStart = function (mouse) {
    this.running = true
    let body = world.getBodiesContaingPoint(mouse)[0]
    if (!body) return;

    bodyClickSelectorTool.data.selectedBody = body
    if (keyboard.isBeingPressed("shift")) {
        // just ot get the functions, will be populates with new info
        let newCopy = physics.createBoxBody(new vec2D(0, 0), 1, 1, 1, 1, false)

        /// copy current state\
        //// TODO: this is a shallow copy, it will reserve reference to the original 
        ///       body's position and vertices and all, hence the lack of a true copy
        // newCopy = cloneObject(body)
        cloneObjectPreserveDestination(newCopy, body)

        // newCopy = structuredClone(body)

        newCopy.ID = generateRandomId()
        newCopy.aabbUpdateRequired = true
        // console.log(body)
        // console.log(newCopy)
        // console.log(body == newCopy)
        bodyClickSelectorTool.data.selectedBody = newCopy
        world.addBody(newCopy)
    }
    bodyClickSelectorTool.data.selectedBody.wait = true
    Caldro.screen.setCursorType(CURSOR_TYPES.GRABBING)
}
bodyClickSelectorTool.onMove = function () {
    if (!events.mouseIsDown) return
    let body = bodyClickSelectorTool.data.selectedBody;
    let difference = vecMath.subtract(MouseToolManager.drawEndCords, MouseToolManager.drawStartCords)
    if (body) {
        if (body.isStatic) {
            body.move(difference)
        } else {

            body.move(difference)
        }
        place(MouseToolManager.drawStartCords, MouseToolManager.drawEndCords)
    } else {
        vecMath.subtract(devCamera, vecMath.divideByVector(difference, devCamera.zoom), true)
    }

}
bodyClickSelectorTool.onEnd = function (mosue) {
    if (this.data.selectedBody)
        this.data.selectedBody.wait = false
    this.data.selectedBody = null;
    this.running = false
    Caldro.screen.setCursorType(CURSOR_TYPES.GRAB)
}
bodyClickSelectorTool.onSwitchTo = function () {
    this.data.previousMouseCursor = Caldro.screen.cursorType
    Caldro.screen.setCursorType(CURSOR_TYPES.GRAB)
}
bodyClickSelectorTool.onSwitchOut = function () {
    Caldro.screen.setCursorType(this.data.previousMouseCursor)
}
// window.bodyClickSelectorTool = bodyClickSelectorTool


export const editVelocityTool = new MouseTool("Drag a body to change its velocity")
editVelocityTool.data = {
    selectedBody: null
}
editVelocityTool.onStart = function (mouse) {
    let body = world.getBodiesContaingPoint(mouse)[0];
    if (!body) return;
    if (body.isStatic) return;
    this.running = true;

    body.wait = true
    this.data.selectedBody = body
}
editVelocityTool.onMove = function (mouse) {
    if (this.data.selectedBody) {
        let velocity = vecMath.subtract(MouseToolManager.drawEndCords, MouseToolManager.drawStartCords)
        this.data.selectedBody.setVelocity(velocity)
    }
}
editVelocityTool.onEnd = function (mouse) {
    if (this.data.selectedBody) {
        this.data.selectedBody.wait = false
        this.data.selectedBody = null
        this.running = false
    }
}
editVelocityTool.render = function (mouse) {
    cordShow(mouse, "yellow", 100, 2, false, currentCamera)
}