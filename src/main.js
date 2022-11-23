export class LameEngine {
  constructor(viewport,classOverwriteFunction = null) {
    this.config = {
      inputEvents: [
        "mousedown",
        "mouseup",
        "click"
      ],
      clickClips: true
    }
    this.viewport = viewport
    this.background = null
    this.camera = new Camera()
    this.objects = []
    this.renderBoundFunctions = []
    this.previousRenderTime = null
    this.inputEvent = function(event,eventName) {
      let mouseHit = [event.clientX - this.toOffset(this.camera.positionX,true),event.clientY - this.toOffset(this.camera.positionY,false)]
      for (let object of this.objects) {
        object = object[0]
        let objectPositionA = [this.toOffset(object.positionX,true),this.toOffset(object.positionY,false)]
        let objectPositionB = [objectPositionA + this.toOffset(object.sizeX,true),this.toOffset(object.sizeY,false)]
        if ((mouseHit[0] >= objectPositionA[0] && mouseHit[1] >= objectPositionA[1]) && (mouseHit[0] <= objectPositionB[0] && mouseHit[1] <= objectPositionB[1])) {
          for (let onInput of object.onInput) {
            onInput(event,eventName)
          }
          if (!clickClips) {
            break
          }
        }
      }
    }

    if (classOverwriteFunction) {
      classOverwriteFunction()
    }

    for (let inputEventName of this.config["inputEvents"]) {
      this.viewport.addEventListener(inputEventName,function(event) {
        this.inputEvent.bind(this,[event,inputEventName])()
      }.bind(this))
    }

    this.viewport.setAttribute("style","overflow: hidden; position: relative;")
  }

  // General
  render() {
    let currentTime = ((new Date()).getTime() / 1000)
    if (this.previousRenderTime) {
      for (let boundFunction of this.renderBoundFunctions) {
        boundFunction(currentTime - this.previousRenderTime)
      }
    }
    this.previousRenderTime = currentTime
    let cameraPositionX = this.toOffset(this.camera.positionX,true)
    let cameraPositionY = this.toOffset(this.camera.positionY,false)
    for (let object of this.objects) {
      let todoPosition = [(this.toOffset(object[0].positionX,true) - cameraPositionX),(this.toOffset(object[0].positionY,false) - cameraPositionY)]
      let todoSize = [(this.toOffset(object[0].sizeX,true) * this.camera.sizeMultiplier),(this.toOffset(object[0].sizeY,false) * this.camera.sizeMultiplier)]
      if (!object[1]) {
        object[1] = object[0]._objectify()
        this.viewport.appendChild(object[1])
        object[0].compiledObject = object[1]
        if (object[2]) {
          object[2].bind(object[0],[object[1]])
          object[2] = undefined
        }
      }

      let finalStyle = String()
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

      let styleTableEntries = Object.entries(styleTable)
      for (let stylePair of styleTableEntries) {
        finalStyle = finalStyle + stylePair[0] + ":" + stylePair[1] + ";"
      }

      object[1].setAttribute("style",finalStyle)
    }
  }

  yield_loop() {
    this.render()
    window.requestAnimationFrame(this.yield_loop.bind(this))
  }

  add_object(object,onCompiled) {
    this.objects.push([object,null,onCompiled])
  }

  remove_objects(objects) {
    this.objects = this.objects.filter(function(value) {
      if (!objects.includes(value[0])) {
        return true
      }
      value[1].remove()
      return false
    })
  }

  bind_toRender(bindFunction) {
    this.renderBoundFunctions.push(bindFunction)
  }

  unbind_fromRender(boundFunction) {
    this.renderBoundFunctions = this.renderBoundFunctions.filter(item => item != boundFunction)
  }

  // Visual
  set_camera(camera) {
    this.camera = camera
  }

  set_background(visual) {
    if (this.background) {
      this.background.remove()
      this.background = null
    }

    if (visual instanceof RGB) {
      this.background = document.createElement("div")
      this.background.setAttribute("style","position: absolute; width: 100%; height: 100%; background-color: rgb(" + String(visual.r) + "," + String(visual.g) + "," + String(visual.b) + ");")
    } else if (visual instanceof Image) {
      this.background = document.createElement("img")
      this.background.setAttribute("style","position: absolute; width: 100%; height: 100%;")
      this.background.setAttribute("src",visual.src)
    }

    if (this.background) {
      this.viewport.appendChild(this.background)
    }
  }

  // Utility
  toOffset(position,isX) {
    if (isX) {
      return position[0] + (position[1] * this.viewport.clientWidth)
    } else {
      return position[0] + (position[1] * this.viewport.clientHeight)
    }
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
  constructor() {
    this.onInput = []
  }

  bind_toInput(onInput) {
    this.onInput.push(onInput)
  }

  unbind_fromClick(onInput) {
    this.onInput = this.onInput.filter(function(element) {
      return !(element === onInput)
    })
  }
}

export class VisualObject extends BaseObject {
  constructor() {
    super()
    this.anchorPoint = [0,0]
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeX = [0,0]
    this.sizeY = [0,0]
    this.rotation = 0
    this.style = {}
    this.compiledObject = null
  }
}

export class Camera extends BaseObject {
  constructor() {
    super()
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeMultiplier = 1
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

  set_image(imageObject) {
    if (!this.compiledObject) {
      throw "Object is not compiled yet. Use a callback at add_object to set the image value!"
    }
    this.compiledObject.setAttribute("src",imageObject.src)
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
    let preparedLink = '<link href="https://fonts.googleapis.com/css2?family=' + fontStringURL + '&display=swap" rel="stylesheet"> '
    if (!currentHeadInnerHtml.includes(preparedLink)) {
      document.head.innerHTML = document.head.innerHTML + "\n" + preparedLink
    }
    this.style["font-family"] = "'" + fontString + "'," + subtypeString
  }

  set_fontsize(textSizeString) {
    this.style["font-size"] = textSizeString
  }
}
