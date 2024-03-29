export class LameEngine {
    constructor(viewport,classOverwriteFunction = null,onFirstRender = null) {
        this.config = {
            inputEvents: [
                "mousemove",
                "mousedown",
                "mouseup",
                "click",
                "keydown",
                "keyup"
            ],
            clickClips: true,
            defaultViewportStyle: {
                "overflow": "hidden",
                "position": "relative"
            }
        }
        this.viewport = viewport
        this.mouseHovering = []
        this.mousePosition = [0,0]
        this.hasRendered = false
        this.camera = new Camera()
        this.previousRenderTime = null
        this.keysDown = []
        this._background = null
        this._objects = []
        this._renderBoundFunctions = []
        this._inputCatchers = []
        this._onFirstRender = onFirstRender
        this._shutdown = false
        this._inputEvent = function(event,eventName) {
            for (let onInput of this._inputCatchers) {
                onInput.bind(this)(event,eventName)
            }
            if (eventName == "mousedown" || eventName == "mouseup" || eventName == "click") {
                for (let object of (this.get_objectsAt(this.mousePosition))) {
                    for (let onInput of object.onInput) {
                        onInput.bind(this,event,eventName)()
                    }
                    if (!this.config["clickClips"]) {
                        break
                    }
                }
            } else if (eventName == "keydown" || eventName == "keyup") {
                let alreadyKnown = undefined
                if (eventName == "keydown") {
                    if (!this.keysDown.includes(event.keyCode)) {
                        this.keysDown.push(event.keyCode)
                        alreadyKnown = false
                    } else {
                        alreadyKnown = true
                    }
                } else if (eventName == "keyup") {
                    if (!this.keysDown.includes(event.keyCode)) {
                        return
                    }
                    this.keysDown = this.keysDown.filter(function(element) {
                        return (element != event.keyCode)
                    })
                }
                if (this.camera.onKey[event.keyCode]) {
                    for (let onKey of this.camera.onKey[event.keyCode]) {
                        onKey(event.keyCode,eventName,alreadyKnown)
                    }
                }
            } else if (eventName == "mousemove") {
                this.mousePosition = [event.clientX - this.toOffset([this.camera.positionX[0],this.camera.positionX[1] - 0.5],true),event.clientY - this.toOffset([this.camera.positionY[0],this.camera.positionY[1] - 0.5],false)]
            }
        }

        if (classOverwriteFunction) {
            classOverwriteFunction.bind(this)()
        }

        for (let inputEventName of this.config["inputEvents"]) {
            let newEventListener = function(event) {
                if (this._shutdown) {
                    document.removeEventListener(inputEventName,newEventListener)
                    return
                }
                this._inputEvent.bind(this)(event,inputEventName)
            }.bind(this)
            document.addEventListener(inputEventName,newEventListener)
        }

        this.viewport.setAttribute("style",this.toStyleCSS(this.config.defaultViewportStyle))
    }

    // General
    render() {
        this.camera.viewportSize = [this.viewport.clientWidth,this.viewport.clientHeight]

        let currentTime = ((new Date()).getTime() / 1000)
        if (this.previousRenderTime) {
            for (let boundFunction of this._renderBoundFunctions) {
                boundFunction(currentTime - this.previousRenderTime)
            }
        }
        this.previousRenderTime = currentTime
        let cameraPositionX = this.toOffset(this.camera.positionX,true) - (this.camera.viewportSize[0] / 2)
        let cameraPositionY = this.toOffset(this.camera.positionY,false)    - (this.camera.viewportSize[1] / 2)
        for (let object of this._objects) {
            let todoPosition = null
            let todoSize = null
            if (object[0].stick) {
                todoPosition = [this.toOffset(object[0].positionX,true),this.toOffset(object[0].positionY,false)]
                todoSize = [this.toOffset(object[0].sizeX,true),this.toOffset(object[0].sizeY,false)]
            } else {
                todoPosition = [(this.toOffset(object[0].positionX,true) - cameraPositionX),(this.toOffset(object[0].positionY,false) - cameraPositionY)]
                todoSize = [(this.toOffset(object[0].sizeX,true) * this.camera.sizeMultiplier),(this.toOffset(object[0].sizeY,false) * this.camera.sizeMultiplier)]
            }
            object[0].absolutePosition = todoPosition
            object[0].absoluteSize = todoSize
            if (object[0].aspectRatio[0] == "X") {
                todoSize[1] = todoSize[0] * object[0].aspectRatio[1]
            } else if (object[0].aspectRatio[0] == "Y") {
                todoSize[0] = todoSize[1] * object[0].aspectRatio[1]
            }
            if (!object[1]) {
                object[1] = object[0]._objectify()
                this.viewport.appendChild(object[1])
                object[0].compiledObject = object[1]
                if (object[2]) {
                    object[2].bind(object[0],object[1])()
                    object[2] = undefined
                }
            }

            let styleTable = object[0].style
            
            // SIZE
            styleTable["width"] = String(todoSize[0]) + "px"
            styleTable["height"] = String(todoSize[1]) + "px"
            // POSITION
            styleTable["position"] = "absolute"
            styleTable["left"] = String(todoPosition[0] - (todoSize[0] * object[0].anchorPoint[0])) + "px"
            styleTable["top"] = String(todoPosition[1] - (todoSize[1] * object[0].anchorPoint[1])) + "px"
            // ROTATION
            styleTable["transform"] = "rotate(" + String(object[0].rotation) + "deg)"

            object[1].setAttribute("style",this.toStyleCSS(styleTable))
        }

        let objectsAtMouse = this.get_objectsAt(this.mousePosition)
        for (let object of objectsAtMouse) {
            if (!this.mouseHovering.includes(object)) {
                continue
            }
            this.mouseHovering.push(object)
        }
        this.mouseHovering = this.mouseHovering.filter(function(value) {
            return objectsAtMouse.includes(value)
        })

        if (!this.hasRendered) {
            this.hasRendered = true
            if (this._onFirstRender) {
                this._onFirstRender.bind(this)()
            }
        }
    }

    yield_loop() {
        if (this._shutdown) {
            return
        }
        this.render()
        window.requestAnimationFrame(this.yield_loop.bind(this))
    }

    break_loop(breakTime) {
        if (this._shutdown) {
            return
        }
        this.render()
        window.requestAnimationFrame(setTimeout.bind(undefined,this.break_loop.bind(this,breakTime),breakTime))
    }

    add_object(object,onCompiled) {
        this._objects.push([object,null,onCompiled])
    }

    added_objects(objects) {
        return this._objects.filter(function(value) {
            return objects.includes(value[0])
        })
    }

    remove_objects(objects) {
        this._objects = this._objects.filter(function(value) {
            if (!objects.includes(value[0])) {
                return true
            }
            if (value[1] != null) {
                value[1].remove()
            }
            return false
        })
        this.mouseHovering = this.mouseHovering.filter(function(value) {
            return !objects.includes(value)
        })
    }

    bind_toRender(bindFunction) {
        this._renderBoundFunctions.push(bindFunction)
    }

    unbind_fromRender(boundFunction) {
        this._renderBoundFunctions = this._renderBoundFunctions.filter(item => item != boundFunction)
    }

    bind_toAllInputs(bindFunction) {
        this._inputCatchers.push(bindFunction)
    }

    unbind_fromAllInputs(boundFunction) {
        this._inputCatchers = this._inputCatchers.filter(item => item != boundFunction)
    }

    destroy() {
        let removeObjectsPacket = []
        for (let object of this._objects) {
            removeObjectsPacket.push(object[0])
        }

        this._shutdown = true
        this.remove_objects(removeObjectsPacket)
        this._background.remove()
        this.viewport.removeAttribute("style")
        delete this
    }

    // Visual
    set_camera(camera) {
        this.camera = camera
    }

    set_background(visual) {
        if (this._background) {
            this._background.remove()
            this._background = null
        }

        if (visual instanceof RGB) {
            this._background = document.createElement("div")
            this._background.setAttribute("style","position: absolute; width: 100%; height: 100%; background-color: rgb(" + String(visual.r) + "," + String(visual.g) + "," + String(visual.b) + ");")
        } else if (visual instanceof Image) {
            this._background = document.createElement("img")
            this._background.setAttribute("style","position: absolute; width: 100%; height: 100%; object-fit: cover;")
            this._background.setAttribute("src",visual.src)
        }

        if (this._background) {
            this.viewport.appendChild(this._background)
        }
    }

    // Utility
    toOffset(position,isX) {
        if (isX) {
            return position[0] + (position[1] * this.camera.viewportSize[0])
        } else {
            return position[0] + (position[1] * this.camera.viewportSize[1])
        }
    }

    toStyleCSS(styleTable) {
        let finalStyle = String()
        let styleTableEntries = Object.entries(styleTable)
        for (let stylePair of styleTableEntries) {
            finalStyle = finalStyle + stylePair[0] + ":" + stylePair[1] + ";"
        }
        return finalStyle
    }

    shakeCamera(duration,strength,speed) {
        let startTime = (new Date()).getTime() / 1000
        let lastValue = 0
        let finalModification = 0
        let engineInstance = this
        let bindRenderFunction = function(progress) {
            let currentTime = (new Date()).getTime() / 1000
            let shakeFactor = currentTime * strength * (speed * 0.05)
            let runningProgress = (currentTime - startTime) / duration
            let finalFactor = strength * engineInstance.get_sine(runningProgress)

            if (runningProgress >= 1) {
                engineInstance.unbind_fromRender(bindRenderFunction)
                engineInstance.camera.positionX = [
                    engineInstance.camera.positionX[0] - finalModification,
                    engineInstance.camera.positionX[1]
                ]
                return
            }

            let newValue = (Math.sin(shakeFactor) + Math.sin(shakeFactor * Math.PI)) / 2 * finalFactor
            let diffValue = (newValue - lastValue)
            engineInstance.camera.positionX = [
                engineInstance.camera.positionX[0] + diffValue,
                engineInstance.camera.positionX[1]
            ]
            finalModification = finalModification + diffValue
            lastValue = newValue
        }
        this.bind_toRender(bindRenderFunction)
    }

    get_objectsAt(position) {
        let objectsAt = []
        for (let object of this._objects) {
            object = object[0]
            if (object.style["visibility"] == "hidden") {
                continue
            }
            let objectPositionA = [this.toOffset(object.positionX,true) - (object.anchorPoint[0] * object.absoluteSize[0]),this.toOffset(object.positionY,false) - (object.anchorPoint[1] * object.absoluteSize[1])]
            let objectPositionB = [objectPositionA[0] + object.absoluteSize[0],objectPositionA[1] + object.absoluteSize[1]]
            if ((position[0] >= objectPositionA[0] && position[1] >= objectPositionA[1]) && (position[0] <= objectPositionB[0] && position[1] <= objectPositionB[1])) {
                objectsAt.push(object)
            }
        }
        return objectsAt
    }

    // Maths
    get_sine(position) {
        return (Math.sin((2 * position) * Math.PI - (Math.PI / 2)) / 2 + 0.5)
    }
}

// Types
export class RGB {
    constructor(r,g,b) {
        this.r = r
        this.g = g
        this.b = b
    }

    to_CSS() {
        return "rgb(" + String(this.r) + "," + String(this.g) + "," + String(this.b) + ")"
    }
}

export class Image {
    constructor(src) {
        this.src = src
    }
}

// Object Classes
export class BaseObject {
    constructor() {}
}

export class VisualObject extends BaseObject {
    constructor() {
        super()
        this.aspectRatio = ["",-1]
        this.stick = false
        this.anchorPoint = [0,0]
        this.positionX = [0,0]
        this.positionY = [0,0]
        this.absolutePosition = [0,0]
        this.absoluteSize = [0,0]
        this.sizeX = [0,0]
        this.sizeY = [0,0]
        this.rotation = 0
        this.style = {}
        this.compiledObject = null
        this.onInput = []
    }
    
    bind_toInput(onInput) {
        this.onInput.push(onInput)
    }

    unbind_fromInput(onInput) {
        this.onInput = this.onInput.filter(function(element) {
            return !(element === onInput)
        })
    }
}

export class Camera extends BaseObject {
    constructor() {
        super()
        this.viewportSize = [0,0]
        this.positionX = [0,0.5]
        this.positionY = [0,0.5]
        this.sizeMultiplier = 1
        this.onKey = {}
    }

    bind_toKey(keyId,onKey) {
        if (!this.onKey[keyId]) {
            this.onKey[keyId] = []
        }
        this.onKey[keyId].push(onKey)
    }

    unbind_fromKey(keyId,onKey) {
        this.onKey[keyId] = this.onKey[keyId].filter(function(element) {
            return !(element === onKey)
        })
    }
}

export class Frame extends VisualObject{
    constructor() {
        super()
    }

    _objectify() {
        return document.createElement("div")
    }

    set_color(rgbColor) {
        this.style["background-color"] = "rgb(" + String(rgbColor.r) + "," + String(rgbColor.g) + "," + String(rgbColor.b) + ")"
    }
}

export class ImageLabel extends VisualObject {
    constructor() {
        super()
    }

    _objectify() {
        return document.createElement("img")
    }

    set_image(imageReference) {
        if (!this.compiledObject) {
            throw "Object is not compiled yet. Use a callback at add_object to set the image value!"
        }
        let imageUrl = ""
        if (imageReference instanceof Image) {
            imageUrl = imageReference.src
        } else {
            imageUrl = imageReference
        }
        this.compiledObject.setAttribute("src",imageUrl)
    }

    set_rendering(renderingString) {
        if (renderingString != "auto" && renderingString != "crisp-edges" && renderingString != "pixelated") {
            throw "Image Rendering must be set to auto, crisp-edges or pixelated."
        }
        this.style["image-rendering"] = renderingString
    }
}

export class TextLabel extends VisualObject {
    constructor() {
        super()
        this._wrapped = false
        this._alignment = "left"
        this._font = ""
    }

    _objectify() {
        return document.createElement("span")
    }

    set_text(textString) {
        if (!this.compiledObject) {
            throw "Object is not compiled yet. Use a callback at add_object to set the text value!"
        }
        this.compiledObject.innerHTML = textString
    }

    set_color(rgbColor) {
        this.style["color"] = "rgb(" + String(rgbColor.r) + "," + String(rgbColor.g) + "," + String(rgbColor.b) + ")"
    }

    set_wrapped(wrapped) {
        this.wrapped = wrapped
        if (wrapped) {
            this.style["word-wrap"] = "break-word"
        } else {
            this.style["word-wrap"] = "normal"
        }
    }

    set_alignment(alignment) {
        if (alignment != "left" && alignment != "center" && alignment != "right" && alignment != "justify") {
            throw "Text Alignment needs to be set to left, center, right or justify."
        }
        this.style["text-align"] = alignment
    }

    set_font(fontString,subtypeString) {
        let currentHeadInnerHtml = document.head.innerHTML
        let fontStringURL = fontString.replace(" ","+")
        let preparedLink = '<link href="https://fonts.googleapis.com/css2?family=' + fontStringURL + '&display=swap" rel="stylesheet">'
        if (!currentHeadInnerHtml.includes(preparedLink)) {
            document.head.innerHTML = document.head.innerHTML + "\n" + preparedLink
        }
        this.style["font-family"] = "'" + fontString + "'," + subtypeString
    }

    set_fontsize(textSizeString) {
        this.style["font-size"] = textSizeString
    }
}
