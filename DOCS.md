# Documentation
## Index
1. Quickstart
2. s

## Quickstart
### Import
`import` the the script url into your `type="module"` loaded script:
(Using my own JSDN here.)

    https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js
Example:

    import {LameEngine} from  "https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js"

*You can of course use any other JavaScript Delivery Service. In this case I've used my own.*
You can **NOT** use the [raw.githubusercontent.com variant](https://raw.githubusercontent.com/BillPlayzToday/LameEngine/main/src/main.js) without any other modifications, as GitHub unfortunately responds to raw-code requests with the "*Content-Type*" Header set to "*text/plain*", which is usually automatically declined as it is not a "*javascript/application*" value
### Construct the Engine-Class
Construct the Engine-Class with the viewport of your Engine-Workspace as the first (and only) argument:
*main.js*

    import {LameEngine} from  "https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js"
    
    var engineInstance = new LameEngine(document.getElementById("viewport"))

The `div` with `id="viewport"` is an already created `div` on the current page, the engine will NOT change anything about its formatting, nor style. Meaning, you can change anything about the viewport, without any restrictions or exceptions.
### Set up and run Engine-Class
We first want to select a background color (in this case to light blue), we'll use the `set_background` with an RGB-Class-Color (we will have to import that).

We now want to start the engine using the `yield_loop` method.

    import {
	    LameEngine,
	    RGB
    } from  "https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js"
    
    var engineInstance = new LameEngine(document.getElementById("viewport"))
    engineInstance.set_background(new RGB(100,100,255)) // This is possible with Images as well, view the reference.
    
    engineInstance.yield_loop() // This will block until the loop is interrupted, it will also throw any exceptions as expected.
### Visualize the first object (TextLabel)
To create the class, simply import it and construct it, we will set the basic properties right after.
**! IMPORTANT !**
This engine uses the `[offset,scale]` system. `offset` describes pixels and `scale` describes screen position in ratios (0 -> 0%; 0.5 -> 50%; 1 -> 100%). Meaning, setting the `sizeX` property to `[0,0.5]` will make your object fill half of the screen, or setting the `positionY` property to `[-50,1]` will position your element 50 pixels above the bottom of your viewport. It's literally the best positioning/sizing system there is, in my opinion.

    import {
	    LameEngine,
	    RGB,
	    TextLabel
    } from  "https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js"
    
    var engineInstance = new LameEngine(document.getElementById("viewport"))
    engineInstance.set_background(new RGB(100,100,255)) // This is possible with Images as well, view the reference.
    
    var newLabel = new TextLabel()
    newLabel.anchorPoint = [0.5,0.5] // Position the label from the middle and not the top-left.
    newLabel.positionX = [0,0.5]
    newLabel.positionY = [0,0.5]
    newLabel.sizeX = [250,0]
    newLabel.sizeY = [30,0]

    engineInstance.yield_loop() // This will block until the loop is interrupted, it will also throw any exceptions as expected.

After this, we will add the newly created object to the engine pipeline using `add_object`, which also allows for a callback function, which allows us to directly modify the compiled element, for example setting the text:

    import {
	    LameEngine,
	    RGB,
	    TextLabel
    } from  "https://billplayz.de/function/jsdn/raw?file=BillPlayzToday/LameEngine/main/src/main.js"
    
    var engineInstance = new LameEngine(document.getElementById("viewport"))
    engineInstance.set_background(new RGB(100,100,255)) // This is possible with Images as well, view the reference.
    
    var newLabel = new TextLabel()
    newLabel.anchorPoint = [0.5,0.5] // Position the label from the middle and not the top-left.
    newLabel.positionX = [0,0.5]
    newLabel.positionY = [0,0.5]
    newLabel.sizeX = [250,0]
    newLabel.sizeY = [30,0]
    
    engineInstance.add_object(newLabel,function(compiledObject) {
	    newLabel.set_text("Hello world!") // This will raise an exception if not called after the first render after the objects creation...
	    // ...as the engine does not memorize such calls for the next render.
    })

    engineInstance.yield_loop() // This will block until the loop is interrupted, it will also throw any exceptions as expected.

### Bind Functions to Render
You can always bind functions to render, which execute BEFORE every render step.

    engineInstance.bind_toRender(function(progress) {
	    // The progress argument describes the seconds that have passed since the last render.
    })

## Reference
