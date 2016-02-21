# GestureManager : An advanced and extensible multi-touch gesture recognizer. #

Gesture Manager offers out-of-the-box multi touch gesture recognition for `tap`, `long tap`, `double tap`, 
`swipe`, `pinch and zoom` and `pinch 5` gestures.

This code is on purpose kept in a structured and long maintainable way. It is not hacky code to keep the codebase
 artificially small. For each type of Gesture, there's a class dedicated to it. The same Tap gesture recognizer could 
 detect a `Tap` for one touch and a `Tap` for ten touches.
  (Yes, i have tried up to eleven touch points at the same time and works as expected). 

The setup is straight:
 
 ```javascript
 
    // create a gesture recognizer and attach it to a node:
    var gm= new GM.GestureManager(document);
    
    // add a number of gestures and pass in a callback to be notified:
        // a tap gesture for 4 touch points
        gm.on( 
            "tap", 
            function( touch_points ) {
                console.log('4 touch points tap.');
            }, 
            4 );
        
        // a swipe of 3 touch points:
        gm.on( 
            "swipe", 
            function( touch_points, direction ) {
                console.log('3 touch points swipe towards direction ', direction);
            },
            3);
 ```

Many different gesture recognizers could be set up for different targets.

## Internals

Internally, each gesture is handled by an instance object extending `GestureRecognizer`. The gesture recognizer is a 
finite state machine. Bear in mind that all GestureRecognizers are exclusive among them. If a `tap 1` fires, a
`tap 3` can't, and if a `swipe 1` fires, a `tap 1` can't either be fired.

There's one exception, and is `pinch and zoom` and `swipe 2`. Both of these gestures can be recognized at the same time
until the swipe will be canceled.

Each of `tap`, `double tap`, `swipe` and `long tap` can be recognized for an arbitrary number of touch points, and it
is guaranteed only one of these gestures will be recognized at the same time.

Gesture `pinch and zoom` will only be recognized for two touch points and `pinch 5` will be recognized only with 5 touch 
points. `Pinch 5` is the multitask gesture on iOS for closing an app.

If you wanted to have a thinner library you could do so by removing recognizers for unnecessary gestures. Objects in the
source code for each gesture type are:

* GR_TAP 
* GR_LongTap
* GR_DoubleTap
* GR_Swipe
* GR_PinchZoom
* GR_Pinch5

** GR_TAP must exist if `GR_LongTap` or `GR_DoubleTap` are needed.

## Demo

[Gesture Manager demo](https://hyperandroid.github.io/GestureManager/index.html)

Make sure you open it from a touch enabled browser.

## Changelog

v.1.1.0 Typescript rewrite. Added package details.
v.1.0.0 stable version released.
