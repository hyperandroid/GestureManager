/**
 * Created by ibon on 2/21/16.
 */

const NO_TOUCH_ID= -1;

/**
 * After this time, any gesture that has not triggered all needed touch info, will be considered CANCELED
 * @type {number}
 */
const TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE= 150;


/**
 * the gesture for tapping can't take longer than this time.
 * It includes from the time to buffer all fingers (gesture start) to the releasing of all of them.
 *
 * @type {Number}
 */
const TAP_TIME_TO_TAP_FROM_START_TO_END= 150;

/**
 * Tap gestures use this threshold to stop considering tap.
 * If more than this pixels are dragged, the gesture is CANCELED.
 * @type {number}
 */
const MOVE_THRESHOLD_TO_CANCEL_GESTURE= 20;

/**
 * Time between first and second tap in a double tap.
 * @type {number}
 */
const DOUBLE_TAP_MAX_TIME= 200;

const DOUBLETAP_TIME_TO_TAP_FROM_START_TO_END= 100;

/**
 * Time in millis to elapse to fire the long tap.
 * This time is measured from the begin of the first touch.
 * @type {number}
 */
const LONGTAP_TIME_TO_FIRE_CALLBACK= 800;


/**
 * If a swipe starts and ends with an angle bigger than this one, the swip will be set as
 * CANT_TELL direction.
 * @type {number}
 */
const SWIPE_RECOGNIZER_ANGLE_THRESHOLD= Math.PI/12;

/**
 * While swiping, at least this number of pixels must be traversed to fire the gesture.
 * @type {number}
 */
const DISTANCE_THRESHOLD_TO_BE_SWIPE= 100;    // pixels to consider swipe.

/**
 * A swipe gesture must last for this time as much.
 * Time includes from first touch begin to release of all touches.
 * @type {number}
 */
const TIME_TO_CONSIDER_VALID_SWIPE= 300;

/**
 * Pinch5 calculates the length of the polygon that the 5 points conform to.
 * As touch points are moved, this polygon changes in shape and length.
 * This gesture will be considered started when the ration between the original contour length and the
 * continuous polygon length varied to be MIN_CONTOUR_RATIO_TO_PINCH5.
 * This number can't be bigger than 1.
 * @type {number}
 */
const MIN_CONTOUR_RATIO_TO_PINCH5= 0.94;

/**
 * Pixels threshold to start considering a Pinch-Zoom gesture.
 * @type {number}
 */
const DISTANCE_THRESHOLD_TO_BE_PINCHZOOM= 20;

/**
 * If this time elapses without the pinch-zoom event started, the gesture will be canceled.
 * This is important so that longtap events don't overlap with pinch-zoom.
 * @type {number}
 */
const TIME_TO_START_PINCH_ZOOM= 700;

/**
 * @interface
 *
 * @name PinchZoomInfo
 *
 * Info for pinch and zoom gesture.
 *
 * @constructor
 */
export interface PinchZoomInfo {

    scale:number;
    rotation:number;
    x:number;
    y:number;
}


const SwipeDirection = {
    LEFT : "left",
    RIGHT : "right",
    DOWN : "down",
    UP : "up",
    CANT_TELL : "can't tell"
};

class GestureTouchInfo {

    _x: number;
    _y:number;
    _endX:number;
    _endY:number;
    _id : number;

    constructor() {
        this._x = -1;
        this._y = -1;
        this._endX = -1;
        this._endY = -1;
        this._id = NO_TOUCH_ID;

        return this;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get endX() {
        return this._endX;
    }

    get endY() {
        return this._endY;
    }

    get id() {
        return this._id;
    }

    reset() {
        this._id= NO_TOUCH_ID;
    }

    initialize(id, x, y) {
        this._id= id;
        this._x= x;
        this._y= y;
        this._endX= x;
        this._endY= y;
    }

    isReleased() {
        return this._id===NO_TOUCH_ID;
    }

    isId(id) {
        return this._id===id;
    }

    setEndPosition( x,y ) {
        this._endX= x;
        this._endY= y;
    }

    isValidDistance( d : number ) {
        const y= this._endY - this._y;
        const x= this._endX - this._x;

        return Math.sqrt(x*x + y*y) > d;
    }
}

enum GestureStatus {

    ST_POSSIBLE =   0,
    ST_BEGAN =      1,
    ST_MOVED =      2,
    ST_ENDED =      3,
    ST_CANCELED =   4,
    ST_FAILED =     5
}

export type TapCallback = ( num_touches: number ) => void;
export type SwipeCallback = ( num_touches : number, direction : string ) => void;
export type PinchZoomCallback = ( info : PinchZoomInfo ) => void;
export type Pinch5Callback = ( scale : number ) => void;

//export type GestureRecognizerCallback = TapCallback | SwipeCallback | PinchZoomCallback | Pinch5Callback;
export type GestureRecognizerCallback = (...a) => void;

type GestureManagerTargetEventListener = ( e:TouchEvent ) => void;

class GestureRecognizer {

    _touchesInfo : GestureTouchInfo[];
    _status : GestureStatus;
    _callback : GestureRecognizerCallback;

    _startTime : number;
    _fingers : number;
    _currentTouchIdCount : number;

    _id : string;

    constructor( callback : GestureRecognizerCallback ) {
        this._status= GestureStatus.ST_POSSIBLE;
        this._touchesInfo= [];
        this._callback= callback;
        this._id = "";
        this._startTime = -1;
        this._fingers = 0;
        this._currentTouchIdCount = -1;
        return this;
    };

    get id() {
        return this._id;
    }

    set id( id : string ) {
        this._id = id;
    }

    clearTouchId(id) {
        const pos= this.getTouchIdPositionInCaptureArray(id);
        if (-1 !== pos ) {
            this._touchesInfo[pos].reset();
        }
    }

    __setStatus(st) {
        this._status= st;
    }

    setCaptureTouchIdLen(n) {
        this._fingers= n;
        this._touchesInfo= [];
        for( let i=0; i<n; i++ ) {
            this._touchesInfo.push( new GestureTouchInfo() );
        }
        this._currentTouchIdCount=0;
    }

    addTouchInfo( ti : Touch ) {
        this._touchesInfo[ this._currentTouchIdCount ].initialize( ti.identifier, ti.pageX, ti.pageY );
        this._currentTouchIdCount += 1;
    }

    getCurrentTouchIdCount() {
        return this._currentTouchIdCount;
    }

    resetTouchIds() {
        this._currentTouchIdCount= 0;
        this._touchesInfo.forEach( function( ti ) {
            ti.reset();
        });
        // this.log("reset touch ids");
    }

    allCapturedTouchIdsReleased() {
        for( let i=0; i<this._touchesInfo.length; i++ ) {
            if ( !this._touchesInfo[i].isReleased() ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get a given touch event position in the captured array.
     * -1 if not exists.
     * @param id
     * @return {Number}
     */
    getTouchIdPositionInCaptureArray(id) {
        if ( !this._touchesInfo ) {
            return -1;
        }

        for( let i=0; i<this._touchesInfo.length; i++ ) {
            if ( this._touchesInfo[i].isId(id) ) {
                return i;
            }
        }

        return -1;
    }

    getTouchInfoById(id) : GestureTouchInfo {
        if ( !this._touchesInfo ) {
            return null;
        }

        for( let i=0; i<this._touchesInfo.length; i++ ) {
            if ( this._touchesInfo[i].isId(id) ) {
                return this._touchesInfo[i];
            }
        }

        return null;
    }

    getGestureElapsedTime() {
        return new Date().getTime() - this._startTime;
    }

    touchesBegan(e : TouchEvent ) {

        if ( this._startTime===-1 ) {
            this._startTime= new Date().getTime();
        }

        if ( this.getCurrentTouchIdCount() < this._fingers ) {
            if ( this.getGestureElapsedTime() > TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE ) {
                //this.log("too much time until i get all the fingers needed.");
                this.failed();
                return;
            }
        }

        if (this.getCurrentTouchIdCount() + e.changedTouches.length>this._fingers) {
            //this.log("too many fingers!!");
            this.failed();
            return;
        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            this.addTouchInfo( e.changedTouches[i] );
        }

        if ( this.getCurrentTouchIdCount()===this._fingers ) {
            this.__setStatus( GestureStatus.ST_BEGAN );
         }
    }

    touchesMoved(e) {
        this.__setStatus( GestureStatus.ST_MOVED );
    }

    touchesEnded(e) {
        this.__setStatus( GestureStatus.ST_ENDED );
    }

    touchesCanceled(e) {
        this.__setStatus( GestureStatus.ST_CANCELED );
        this.failed();
    }

    failed() {
        this.__setStatus( GestureStatus.ST_FAILED);
    }

    reset() {
        this.__setStatus( GestureStatus.ST_POSSIBLE );
        this.resetTouchIds();
        this._startTime= -1;
    }

    acceptsInput() {
        return  !(  this._status === GestureStatus.ST_FAILED ||
                    this._status === GestureStatus.ST_CANCELED ||
                    this._status === GestureStatus.ST_ENDED );
    }

    getStatus() {
        return this._status;
    }
}

class GR_Tap extends GestureRecognizer {

    constructor(fingers : number, callback : GestureRecognizerCallback ) {
        super(callback);

        fingers= fingers|0;
        this.setCaptureTouchIdLen(fingers);
        this.id ="Tap "+fingers;

        return this;
    }

    touchesMoved(e : TouchEvent ) {
        super.touchesMoved(e);

        for( let i=0; i<e.changedTouches.length; i+=1 ) {

            const indexId= this.getTouchIdPositionInCaptureArray(e.changedTouches[i].identifier);
            if (-1!=indexId) {

                const touchInfo= this._touchesInfo[ indexId ];

                const offsetX= Math.abs( touchInfo.x - e.changedTouches[i].pageX );
                const offsetY= Math.abs( touchInfo.y - e.changedTouches[i].pageY );

                if ( offsetX>MOVE_THRESHOLD_TO_CANCEL_GESTURE || offsetY>MOVE_THRESHOLD_TO_CANCEL_GESTURE ) {
                    this.failed();
                    return;
                }
            }
        }

    }

    touchesEnded(e : TouchEvent ) {
        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this.failed();
            return;
        }

        const elapsedTime= this.getGestureElapsedTime();

        if ( elapsedTime > TAP_TIME_TO_TAP_FROM_START_TO_END ) {
            this.failed();
            return;

        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }

        if ( this.allCapturedTouchIdsReleased() ) {
            super.touchesEnded(e);
            this._callback && this._callback(this._fingers);
        }
    }
}

class GR_DoubleTap extends GR_Tap {

    _prevTime : number;

    constructor(fingers : number, callback : GestureRecognizerCallback ) {
        super( fingers, callback );
        this.id= "DoubleTap";
        this._prevTime = 0;
        return this;
    }

    touchesEnded(e : TouchEvent) {
        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this._prevTime=0;
            this.failed();
            return;
        }

        const elapsedTime= this.getGestureElapsedTime();

        if ( elapsedTime > DOUBLETAP_TIME_TO_TAP_FROM_START_TO_END ) {
            this._prevTime=0;
            this.failed();
            return;

        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }

        if ( this.allCapturedTouchIdsReleased() ) {

            const t= new Date().getTime();
            if ( t - this._prevTime < DOUBLE_TAP_MAX_TIME ) {
                if ( this._callback ) {
                    this._callback(this._fingers);
                }
            }

            this._prevTime= t;
        }
    }
}

class GR_LongTap extends GR_Tap {

    _timer : number;

    constructor(fingers : number, callback : GestureRecognizerCallback ) {
        super( fingers, callback);
        this.id= "LongTap "+fingers;
        this._timer = -1;
        return this;
    }

    touchesBegan(e: TouchEvent) {
        super.touchesBegan(e);

        if ( this.getStatus()===GestureStatus.ST_BEGAN ) {
            this.__cancelTimer();
            this._timer= setTimeout( this.__fireEvent.bind(this), LONGTAP_TIME_TO_FIRE_CALLBACK);
        }
    }

    __fireEvent() {
        if ( this._callback ) {
            this._callback(this._fingers);
        }
    }

    touchesEnded(e : TouchEvent) {
        this.__cancelTimer();
    }

    failed() {
        super.failed();
        this.__cancelTimer();
    }

    __cancelTimer() {
        if ( this._timer ) {
            clearTimeout( this._timer );
            this._timer=-1;
        }
    }
}



class GR_Swipe extends GestureRecognizer {

    constructor(fingers : number, callback : GestureRecognizerCallback) {
        super( callback );

        this._fingers= fingers|0;

        this.id= "Swipe "+fingers;
        this.setCaptureTouchIdLen(fingers);

        return this;
    }

    touchesEnded(e : TouchEvent) {

        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this.failed();
            return;
        }

        if ( this.getGestureElapsedTime() > TIME_TO_CONSIDER_VALID_SWIPE ) {
            this.failed();
            return;
        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const touch= e.changedTouches[i];
            const id= touch.identifier;

            const touchInfo= this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
                if ( !touchInfo.isValidDistance(DISTANCE_THRESHOLD_TO_BE_SWIPE)) {
                    this.failed();
                    return;
                }
            }

            this.clearTouchId(id);
        }

        if ( this.allCapturedTouchIdsReleased() ) {

            // only angle for touch 0
            const swipe_dir= this.__getSwipeDirection( this._touchesInfo[0] );
            for( let i=1; i<this.getCurrentTouchIdCount(); i+=1 ) {
                if ( swipe_dir!==this.__getSwipeDirection(this._touchesInfo[i]) ) {
                    this.failed();
                    return;
                }
            }

            super.touchesEnded(e);
            if ( this._callback ) {
                this._callback(this._fingers, swipe_dir);
            }
        }
    }

    __getSwipeDirection( touchInfo : GestureTouchInfo ) : string {

        const yy= touchInfo.endY - touchInfo.y;
        const angle= Math.abs(Math.atan2( yy, touchInfo.endX - touchInfo.x ));

        if ( angle>=0 && angle<SWIPE_RECOGNIZER_ANGLE_THRESHOLD ) {
            return SwipeDirection.RIGHT;
        } else if (angle<Math.PI && angle>Math.PI - SWIPE_RECOGNIZER_ANGLE_THRESHOLD) {
            return SwipeDirection.LEFT;
        } else if ( angle>=Math.PI/2-SWIPE_RECOGNIZER_ANGLE_THRESHOLD && angle<Math.PI/2+SWIPE_RECOGNIZER_ANGLE_THRESHOLD ) {
            return yy<0 ? SwipeDirection.UP : SwipeDirection.DOWN;
        }

        return SwipeDirection.CANT_TELL;
    }
}

class GR_Pinch5 extends GestureRecognizer {

    _contour : number;
    _started : boolean;

    constructor(callback : GestureRecognizerCallback) {
        super(callback);

        this._contour = 0;
        this._started = false;

        this.setCaptureTouchIdLen(5);
        this.id= "Pinch5";

        return this;
    }

    touchesBegan(e:TouchEvent) {
        super.touchesBegan(e);
        if ( this.getStatus()===GestureStatus.ST_BEGAN ) {
            this._contour= this.__getContourLength();
        }
    }

    __getContourLength() {
        let contour= 0;
        const ti0= this._touchesInfo[0];

        this._touchesInfo.forEach( function(ti1) {
            contour+= Math.sqrt( (ti1.endX-ti0.endX)*(ti1.endX-ti0.endX) + (ti1.endY-ti0.endY)*(ti1.endY-ti0.endY) );
        });

        return contour;
    }

    touchesMoved(e:TouchEvent) {

        if ( !this.acceptsInput() ) {
            return;
        }

        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this.failed();
            return;
        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const touch= e.changedTouches[i];
            const id= touch.identifier;
            const touchInfo= this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
            }
        }

        const contour= this.__getContourLength();
        const ratio= contour/this._contour;

        if (!this._started) {
            if ( contour/this._contour < MIN_CONTOUR_RATIO_TO_PINCH5 ) {
                this._started= true;
                this.__notify(ratio);
            }
        } else {
            this.__notify(ratio);
        }
    }

    __notify( ratio ) {
        if ( this._callback ) {
            this._callback( ratio );
        }
    }

    touchesEnded(e : TouchEvent) {

        if (!this._started) {
            this.failed();
            return;
        }

        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this.failed();
            return;
        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }

        if ( this.allCapturedTouchIdsReleased() ) {
            super.touchesEnded(e);
            if ( this._callback ) {
                this._callback( 0 );
            }
        }
    }

    reset() {
        super.reset();
        this._started= false;
    }
}

class GR_PinchZoom extends GestureRecognizer {

    _gestureRotation : number;
    _gestureScale : number;
    _scale : number;
    _rotation : number;
    _started : boolean;

    constructor(callback : GestureRecognizerCallback ) {
        super(callback);
        this.setCaptureTouchIdLen(2);
        this.id = "Pinch and Zoom";

        this._gestureRotation = 0;
        this._gestureScale = 0;
        this._scale = 1;
        this._rotation = 0;
        this._started = false;

        return this;
    }

    touchesBegan(e : TouchEvent) {
        super.touchesBegan(e);

        if ( this.getStatus()===GestureStatus.ST_BEGAN ) {

            const e0= this._touchesInfo[0];
            const e1= this._touchesInfo[1];

            this._scale= 1;
            this._rotation= 0;
            this._gestureScale= Math.sqrt( (e1.y-e0.y)*(e1.y-e0.y) + (e1.x-e0.x)*(e1.x-e0.x) );
            this._gestureRotation= Math.atan2( e1.y-e0.y, e1.x-e0.x );

        }
    }

    touchesMoved(e : TouchEvent ) {

        if ( !this.acceptsInput() ) {
            return;
        }

        if ( this.getCurrentTouchIdCount()!==this._fingers) {
            this.failed();
            return;
        }

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const touch= e.changedTouches[i];
            const id= touch.identifier;
            const touchInfo= this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
            }
        }

        if (!this._started) {
            if ( this.getGestureElapsedTime() > TIME_TO_START_PINCH_ZOOM ) {
                this.failed();
                return;
            }

            for( let i=0; i<this._touchesInfo.length; i++ ) {
                if (!this._touchesInfo[i].isValidDistance(DISTANCE_THRESHOLD_TO_BE_PINCHZOOM)) {
                }
            }

            this._started= true;
        }

        super.touchesMoved(e);

        const e0= this._touchesInfo[0];
        const e1= this._touchesInfo[1];
        const gr= Math.atan2( e1.endY-e0.endY, e1.endX-e0.endX );

        this._rotation+= gr - this._gestureRotation;
        this._gestureRotation= gr;

        const gs= Math.sqrt( (e1.endY-e0.endY)*(e1.endY-e0.endY) + (e1.endX-e0.endX)*(e1.endX-e0.endX) );

        const sc= this._scale + ( gs/this._gestureScale ) - 1;

        if ( sc<0.2 ) {
            this._scale= 0.2;
        } else {
            this._scale = sc;
            this._gestureScale= gs;
        }

        const tx = e0.endX - e0.x;
        const ty = e0.endY - e0.y;

        if ( this._callback ) {
            this._callback( {
                scale: this._scale,
                rotation : this._rotation*180/Math.PI,
                x : tx,
                y : ty
            } );
        }
    }

    touchesEnded(e) {
        if ( !this.allCapturedTouchIdsReleased() ) {
            this.failed();
        } else {
            super.touchesEnded(e);
        }
    }

    reset() {
        super.reset();
        this._started= false;
    }
}

export class GestureManager {

    _gestureRecognizerList: GestureRecognizer[];
    _touchIds :             number[];
    _target :               Node;

    _touchStartFn :         GestureManagerTargetEventListener;
    _touchEndFn :           GestureManagerTargetEventListener;
    _touchCancelFn :        GestureManagerTargetEventListener;
    _touchMoveFn :          GestureManagerTargetEventListener;

    constructor( target : Node ) {
        this._gestureRecognizerList= [];
        this._touchIds=              [];
        this._target=                null;

        this._touchStartFn =         this.__touchStartHandler.bind(this);
        this._touchMoveFn =          this.__touchMoveHandler.bind(this);
        this._touchEndFn =           this.__touchEndHandler.bind(this);
        this._touchCancelFn=         this.__touchCancelHandler.bind(this);

        if ( target ) {
            this.__setTarget( target );
        }

        return this;
    }

    __findIdPos(id) {

        for( let i=0; i<this._touchIds.length; i++ ) {
            if ( this._touchIds[i]===id ) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Set this gesture recognizer target element.
     * @param target {HTMLElement}
     * @private
     */
    __setTarget( target ) {
        if ( this._target ) {
            this._target.removeEventListener("touchstart",      this._touchStartFn);
            this._target.removeEventListener("touchmove",       this._touchMoveFn);
            this._target.removeEventListener("touchend",        this._touchEndFn);
            this._target.removeEventListener("touchcancel",     this._touchCancelFn);

            this._target.removeEventListener("MozTouchDown",    this._touchStartFn);
            this._target.removeEventListener("MozTouchMove",    this._touchMoveFn);
            this._target.removeEventListener("MozTouchRelease", this._touchEndFn);
            this._target.removeEventListener("MozTouchCancel",  this._touchCancelFn);
        }

        this._target= target;

        target.addEventListener("touchstart",       this._touchStartFn,  false);
        target.addEventListener("touchmove",        this._touchMoveFn,   false);
        target.addEventListener("touchend",         this._touchEndFn,    false);
        target.addEventListener("touchcancel",      this._touchCancelFn, false);

        target.addEventListener("MozTouchDown",     this._touchStartFn,  false);
        target.addEventListener("MozTouchMove",     this._touchMoveFn,   false);
        target.addEventListener("MozTouchRelease",  this._touchEndFn,    false);
        target.addEventListener("MozTouchCancel",   this._touchCancelFn, false);

    }

    __touchStartHandler(e : TouchEvent ) {
        e.preventDefault();

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const id= e.changedTouches[i].identifier;
            if ( this.__findIdPos(id)===-1 ) {
                this._touchIds.push(id);
            }
        }

        this._gestureRecognizerList.forEach( function( gr ) {
            if ( gr.acceptsInput() ) {
                gr.touchesBegan(e);
            }
        });
    }

    __touchMoveHandler(e : TouchEvent) {
        e.preventDefault();

        this._gestureRecognizerList.forEach( function( gr ) {
            if ( gr.acceptsInput() ) {
                gr.touchesMoved(e);
            }
        });
    }

    __touchEndHandler(e : TouchEvent) {

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const id= e.changedTouches[i].identifier;
            const pos= this.__findIdPos(id);
            if ( pos!==-1 ) {
                this._touchIds.splice(pos,1);
            }
        }

        e.preventDefault();

        this._gestureRecognizerList.forEach( function( gr ) {
            if ( gr.acceptsInput() ) {
                gr.touchesEnded(e);
            }
        });

        this.__shouldReset();
    }

    __touchCancelHandler(e : TouchEvent) {

        for( let i=0; i<e.changedTouches.length; i+=1 ) {
            const id= e.changedTouches[i].identifier;
            const pos= this.__findIdPos(id);
            if ( pos!==-1 ) {
                this._touchIds.splice(pos,1);
            }
        }

        e.preventDefault();

        this._gestureRecognizerList.forEach( function( gr ) {
            if ( gr.acceptsInput() ) {
                gr.touchesCanceled(e);
            }
        });

        this.__shouldReset();
    }

    __shouldReset() {
        if (this._touchIds.length===0) {
            this.__resetGestureRecognizers();
        }
    }

    addGestureRecognizer( gr : GestureRecognizer ) {
        this._gestureRecognizerList.push( gr );
        return this;
    }

    __resetGestureRecognizers() {
        this._gestureRecognizerList.forEach( function( gr ) {
            gr.reset();
        });
    }

    on( event : string, callback : GestureRecognizerCallback, touch_points? : number ) {
        switch( event ) {
            case "tap":
                this.addGestureRecognizer(new GR_Tap(touch_points, callback));
                break;
            case "longtap":
                this.addGestureRecognizer(new GR_LongTap(touch_points, callback));
                break;
            case "doubletap":
                this.addGestureRecognizer(new GR_DoubleTap(touch_points, callback));
                break;
            case "swipe":
                this.addGestureRecognizer(new GR_Swipe(touch_points, callback));
                break;
            case "pinchzoom":
                this.addGestureRecognizer(new GR_PinchZoom(callback));
                break;
            case "pinch5":
                this.addGestureRecognizer(new GR_Pinch5(callback));
                break;
            default:

        }
    }
}

