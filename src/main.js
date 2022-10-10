export class LameEngine {
  constructor(viewport) {
    this.viewport = viewport
    this.background = null
    this.camera = Camera()
  }

  // General
  set_

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
}

// Types
export class RGB {
  constructor(r, g, b) {
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
    this.x = 0
    this.y = 0
  }
}

export class Frame {
  constructor() {
    this.position = {
      "x": 0,
      "y": 0
    }
    this.size = {
      "x": 0,
      "y": 0
    }
    this.rotation = 0
  }
}

export class ImageLabel {
  constructor() {
    this.position = {
      "x": 0,
      "y": 0
    }
    this.size = {
      "x": 0,
      "y": 0
    }
    this.rotation = 0
  }
}

export class TextLabel {
  constructor() {
    this.position = {
      "x": 0,
      "y": 0
    }
    this.size = {
      "x": 0,
      "y": 0
    }
    this.rotation = 0
    this.wrapped = 0
  }
}
