export class LameEngine {
  constructor(viewport) {
    this.viewport = viewport
    this.background = null
    this.camera = new Camera()
    this.objects = []
    this.renderBoundFunctions = []
    this.previousRenderTime = null
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
    for (let object of this.objects) {
      let cameraPositionX = this.toOffset(this.camera.positionX)
      let cameraPositionY = this.toOffset(this.camera.positionY)
      let todoPosition = [(this.toOffset(object[0].positionX) - cameraPositionX),(this.toOffset(object[0].positionY) - cameraPositionY)]
      let todoSize = [(this.toOffset(object[0].sizeX) * this.camera.sizeMultiplier),(this.toOffset(object[0].sizeY) * this.camera.sizeMultiplier)]
      if (!object[1]) {
        object[1] = object[0]._objectify()
        this.viewport.appendChild(object[1])
      }

      let finalStyle = object.style
      // SIZE
      finalStyle = finalStyle + " " + "width: " + String(todoSize[0]) + "px; height: " + String(todoSize[1]) + "px;"
      // POSITION
      finalStyle = finalStyle + " " + "left: " + String(todoPosition[0] - (todoSize[0] / 2)) + "px; top: " + String(todoPosition[1] - (todoSize[1] / 2)) + "px;"

      object[1].setAttribute("style",finalStyle)
    }
  }

  yield_loop() {
    window.requestAnimationFrame(this.yield_loop)
  }

  auto_loop() {
    setTimeout(this.yield_loop,0)
  }

  add_object(object) {
    this.objects.push([object,null])
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
  toOffset(position) {
    return position[0] + (position[1] * this.viewport.clientWidth)
  }
}

// Types
export class RGB {
  constructor(r,g,b) {
    this.r = r
    this.g = g
    this.b = b
  }
}

export class Image {
  constructor(src) {
    this.src = src
  }
}

// Object Classes
export class Camera {
  constructor() {
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeMultiplier = 1
  }
}

export class Frame {
  constructor() {
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeX = [0,0]
    this.sizeY = [0,0]
    this.rotation = 0
    this.style = ""
  }

  _objectify() {
    return document.createElement("div")
  }
}

export class ImageLabel {
  constructor() {
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeX = [0,0]
    this.sizeY = [0,0]
    this.rotation = 0
    this.style = ""
  }

  _objectify() {
    return document.createElement("img")
  }
}

export class TextLabel {
  constructor() {
    this.positionX = [0,0]
    this.positionY = [0,0]
    this.sizeX = [0,0]
    this.sizeY = [0,0]
    this.rotation = 0
    this.wrapped = 0
    this.style = ""
  }

  _objectify() {
    return document.createElement("span")
  }
}
