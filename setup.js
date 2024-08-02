import Caldro, { CaldroCIM, CaldroKeys } from "../Caldro/src/Caldro.js";
import { c } from "../Caldro/src/Caldro_Canvas.js";
import { classicPhysics, classicPhysicsWorld, CollisionManifold, Collisions } from "../Caldro/src/Caldro_ClassicPhysics.js";
import { adjustCanvas, font, rect, textOutline, txt } from "../Caldro/src/Caldro_Rendering.js";
import { cordShow, drawCoordinateGraph } from "../Caldro/src/Caldro_Renderers.js";
import { Camera, setupDevcamControls } from "../Caldro/src/Caldro_Camera.js";
import { arrUtils, vec2D, vecMath } from "../Caldro/src/Caldro_Vectors_and_Matrices.js";
import { events, keyboard, keyStateHandler } from "../Caldro/src/Caldro_Controls.js";
import { doTask, place, randomNumber, timeTask } from "../Caldro/src/Caldro_Utility_Functions.js";
import { bodyClickSelectorTool, drawBoxBodyTool, drawCircleBodyTool, drawPolyponBodyTool, editVelocityTool } from "./tools.js";
import { CALDBLUE, CURSOR_TYPES } from "../Caldro/src/Caldro_Utility_Constants.js";
import { MouseToolManager } from "./core/MouseToolManager.js";
import { cloneObjectPreserveDestination } from "../Caldro/src/Caldro_Serialization.js";
import { loadFromLocalStorage } from "../Caldro/src/Caldro_LocalStorage.js";



export const world = new classicPhysicsWorld();
export const physics = new classicPhysics();
physics.safeMode = false
export let gridSize = 4
window.gridSize = gridSize
let subdivisions = 5

export const devCamera = new Camera(c);
devCamera.enablePersistence("DevCamera")
window.devCamera = devCamera

export const camera = new Camera(c);
window.camera = camera
camera.setZoom(14)

Caldro.info.currentKeyStateHandler = CaldroKeys
window.CaldroKeys = CaldroKeys
window.world = world

export let currentCamera = devCamera

Caldro.screen.setCursorType(CURSOR_TYPES.NONE)

const Engine = Caldro.engine

export function SETUP() {
    const ground = physics.createBoxBody(new vec2D(0, 20), 1000, 40, 1, 1, true)

    Engine.PRELOOP = () => {
        MouseToolManager.update();
    }
    Engine.UPDATE = () => {
        world.step(Caldro.time.deltatime, 10)
    }

    Engine.RENDER = () => {
        adjustCanvas()
        /// background
        rect(0, 0, c.width, c.height, CALDBLUE)

        currentCamera.start();
        if (currentCamera == devCamera)
            drawCoordinateGraph(currentCamera, gridSize, "white", gridSize * subdivisions, false, true, true, !keyboard.isBeingPressed("alt"))


        /// draww all bodies
        world.renderBodies(false, camera)

        /// draw grid selection area
        MouseToolManager.render()

        // little white cross at the camera pointer
        cordShow(currentCamera.getPointer(), "white", 20, 2, false, currentCamera)

        // debug view helpers when using devCam
        if (devCamera == currentCamera) {
            // currentCamera.showCamera(camera)
            cordShow(devCamera, "lime", 20, 2, false, currentCamera)
        }


        /// stop camera
        currentCamera.end();

        /// what tool is active right now
        if (MouseToolManager.equippedTool) {
            textOutline(10, "darkblue")
            txt(MouseToolManager.equippedTool.name, c.xc, 40, font(30), "white")
            textOutline(0)
        }
    }

    Engine.ONSTART = () => {
        // world.addBody(ground)
        MouseToolManager.setTool(bodyClickSelectorTool)
        setupControls();
        console.log("Setup complete")


        let stack = 10;
        let size = 4
        let colomns = 1
        let increment = 1
        let x = 0 - size / 2
        let y = -2
        for (let row = stack; row > 0; --row) {
            for (let j = 1; j < colomns + 1; ++j) {
                let bx = x + (size * (j - colomns / 2))
                let by = y - (row * size) + (size / 2);
                let body = physics.createCircleBody(new vec2D(bx, by), size, 0, 1, false)
                // let body = physics.createBoxBody(new vec2D(bx, by), size, size, 0, 1, false)
                world.addBody(body)
                body.angularAcceleration = 1000
                body.staticFriction = 1
                body.dynamicFriction = 0.6
            }
            colomns += increment
        }
    }

    let planeVerticies = new Array();
    let heightRandomeness = 6
    let resolution = 40
    let spanX = 2000
    let startX = -spanX / 2
    startX = -100
    let currentX = startX
    let currentY = 20
    let amount = spanX / resolution

    /// populate verticies of plane
    for (let i = 0; i < amount; ++i) {
        let x = currentX
        let y = currentY - randomNumber(0, +heightRandomeness)
        // let y = currentY + randomNumber(-heightRandomeness / 2, +heightRandomeness / 2)
        let vertex = new vec2D(x, y)
        planeVerticies.push(vertex)
        currentX += resolution
        currentY = y
    }

    /// create polygones from these verticies
    for (let i = 0; i < amount; i++) {
        if (!planeVerticies[i + 1]) break
        let verticies = [
            planeVerticies[i],
            planeVerticies[i + 1],
            new vec2D(planeVerticies[i + 1].x, 100),
            new vec2D(planeVerticies[i].x, 100)
        ]
        let center = Collisions.findArithmeticMeanPoint(verticies)
        verticies = classicPhysics.centerVerticies(verticies)
        let body = physics.createPolygonBody(center, verticies, 1, 1, 0.1, 1, true)
        world.addBody(body)
    }

    let rollerPos = new vec2D(startX + resolution + 1, -20)
    let roller = physics.createCircleBody(rollerPos, 1, 0.2, classicPhysicsWorld.maxDensity * 20, false)
    roller.angularAcceleration = 10000000
    roller.staticFriction = 10
    roller.callback = () => {
        place(camera, roller.position)
    }
    world.addBody(roller)

    events.pointStartEvent = () => {
        let mouse = currentCamera.getPointer()
        MouseToolManager.onStart();
    }
    events.pointMoveEvent = () => {
        let mouse = currentCamera.getPointer()
        MouseToolManager.onMove();
    }
    events.pointEndEvent = () => {
        MouseToolManager.onEnd();
    }


    // CaldroKeys.strictMatch = false;
    CaldroKeys.addKey(0, ",", function () {
        if (currentCamera === camera) {
            currentCamera = devCamera
        } else {
            currentCamera = camera
        }
    })
}
CaldroKeys.addKey(-1, "p", function () {
    Engine.paused = !Engine.paused
})
CaldroKeys.addKey(-1, "c", function () {
    if (keyboard.isBeingPressed("alt"))
        world.removeAllBodies();
})


function setupControls() {
    let velocity = 10
    let speed = 50
    CaldroKeys.addKey(0, "arrowleft", () => {
        player.addVelocity(new vec2D(-velocity, 0))
    })
    CaldroKeys.addKey(0, "arrowright", () => {
        player.addVelocity(new vec2D(velocity, 0))
    })
    CaldroKeys.addKey(-1, " ", () => {
        // player.addVelocity(new vec2D(0, -40))
    })
    CaldroKeys.addKey(-1, "`", () => {
        MouseToolManager.setTool(bodyClickSelectorTool)
    })
    CaldroKeys.addKey(-1, "1", () => {
        MouseToolManager.setTool(drawBoxBodyTool)
    })
    CaldroKeys.addKey(-1, "2", () => {
        MouseToolManager.setTool(drawCircleBodyTool)
    })
    CaldroKeys.addKey(-1, "2", () => {
        console.log("2")
    })
    CaldroKeys.addKey(-1, "3", () => {
        MouseToolManager.setTool(drawPolyponBodyTool)
    })
    CaldroKeys.addKey(-1, "4", () => {
        MouseToolManager.setTool(editVelocityTool)
    })

    events.mouseScrollUp = () => {
        if (keyboard.isBeingPressed("alt"))
            devCamera.angle -= 10
        else if (keyboard.isBeingPressed("shift"))
            devCamera.x -= speed * (1 / devCamera.zoom.x)
        else if (keyboard.isBeingPressed("ctrl"))
            devCamera.addZoom(1, currentCamera.getPointer())
        else
            devCamera.y -= speed * (1 / devCamera.zoom.y)
    }
    events.mouseScrollDown = () => {
        if (keyboard.isBeingPressed("alt"))
            devCamera.angle += 10
        else if (keyboard.isBeingPressed("shift"))
            devCamera.x += speed * (1 / devCamera.zoom.x)
        else if (keyboard.isBeingPressed("ctrl"))
            devCamera.addZoom(-1)
        else
            devCamera.y += speed * (1 / devCamera.zoom.y)
    }
    CaldroKeys.addKey(-1, "K", () => {
        saveBodies()
    })
    CaldroKeys.addKey(-1, "L", () => {
        if (keyboard.isBeingPressed("alt"))
            removeBodies();
        else
            looadBodies();
    })
}
window.CaldroKeys = CaldroKeys

function getSaves() {
    let savedIDs = localStorage.getItem("Saved-Bodies-IDs")
    if (!savedIDs)
        savedIDs = new Array();
    else
        return JSON.parse(savedIDs)

    return savedIDs
}
function getSavesAsText() {
    let saves = getSaves();
    let text = "Here are the available saves; \n["
    for (let ID of saves) {
        text += `\n  ${ID},`
    }
    text += "\n]"

    if (saves.length == 0) {
        text = "There are NO available saves!\n"
    }
    return text
}
function addSave(ID, objcetToSave) {
    let saves = getSaves();
    let alreadyExsists = saves.includes(ID)
    if (!alreadyExsists)
        saves.push(ID)

    localStorage.setItem("Saved-Bodies-IDs", JSON.stringify(saves))
}
function removeSave(ID) {
    let saves = getSaves();
    saves = saves.filter((item) => {
        return item !== ID
    })

    localStorage.setItem("Saved-Bodies-IDs", JSON.stringify(saves))
}

function looadBodies() {
    /// the last save for easy loading
    let lastSavedID = localStorage.getItem("last-Save")
    let loadID = prompt(
        `LOADING SAVE\n\nWhat save do you want to load?\n\n${getSavesAsText()}`,
        lastSavedID ? lastSavedID : ''
    )

    /// if there is no user input or the user cancels out then stop here
    if (!loadID) return;

    let savedBodiesString = localStorage.getItem(loadID)
    if (!savedBodiesString) {
        alert(`No save of ID: '${loadID}' was found`)
        return;
    }


    world.removeAllBodies();
    let bodies = JSON.parse(savedBodiesString)
    console.log(bodies[0].linearVelocityCap)
    for (let body of bodies) {
        let mockBody = physics.createBoxBody(new vec2D(0, 0), 1, 1, 1, 1)
        // console.log(body.linearVelocityCap)
        mockBody.aabbUpdateRequired = true
        cloneObjectPreserveDestination(mockBody, body)
        world.addBody(mockBody)
    }

    /// set the last saved ID for easy reloading for loadBodies
    localStorage.setItem("last-Save", loadID)
}
function saveBodies() {
    let lastSavedID = localStorage.getItem("last-Save")
    let saveID = prompt(
        `ADDING SAVE\n\nWhat do you want to save these bodies as? (Default is the last saved bodiees name)\n\n${getSavesAsText()}`,
        lastSavedID ? lastSavedID : ''
    )

    /// if there is no user input or the user cancels out then stop here
    if (!saveID) return

    /// add the saves to the list for refercnecing later
    addSave(saveID, world.bodies)

    /// actually save the bodies
    localStorage.setItem(saveID, JSON.stringify(world.bodies))

    /// set the last saved ID for easy reloading for loadBodies
    localStorage.setItem("last-Save", saveID)
}
function removeBodies() {
    let lastSavedID = localStorage.getItem("last-Save")
    let saveID = prompt(
        `DELETING SAVE\n\nWhat save do you want to delete?\n\n${getSavesAsText()}`,
        lastSavedID ? lastSavedID : ''
    )

    /// if there is no user input or the user cancels out then stop here
    if (!saveID) return

    /// find out if this save even exsists in the first palce
    let save = localStorage.getItem(saveID) ? true : false;

    if (!save) {
        alert(`No save with ID of ${saveID} was found`)
        /// remove it from the saved ids array

        /// remove the save form the id list
        removeSave(saveID)
        return;
    }

    /// confirm  if this delete is legit
    let proceed = confirm("Save Found, Proceed?")
    if (!proceed) return;

    /// remove the save form the id list
    removeSave(saveID)

    /// actually save the bodies
    localStorage.removeItem(saveID)

    /// set the last saved ID for easy reloading for loadBodies
    localStorage.setItem("last-Save", '')
}
window.looadBodies = looadBodies