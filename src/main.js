export class LameEngine {
  constructor(viewport) {
    this.viewport = viewport
    this.background = null
  }

  // VISUAL
  set_background(visual) {
    console.log(visual instanceof RGB)
    console.log(visual instanceof Image)
    if (this.background) {
      this.background.remove()
      this.background = null
    }

    if (visual instanceof RGB) {
      this.background = document.createElement("div")
      this.background.setAttribute("style","width: 100%; height: 100%; background-color: rgb(" + String(visual.r) + "," + String(visual.g) + "," + String(visual.b) + ");")
    } else if (visual instanceof Image) {
      this.background = document.createElement("img")
      this.background.setAttribute("style","width: 100%; height: 100%;")
      this.background.setAttribute("src",visual.src)
    }

    if (this.background) {
      this.viewport.appendChild(this.background)
    }
  }
}

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