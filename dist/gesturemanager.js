var GM = window.GM || {};

GM.extend = function (subc, superc) {
    var subcp = subc.prototype;

    // Class pattern.
    var f = function () {
    };
    f.prototype = superc.prototype;

    subc.prototype = new f();       // chain prototypes.
    subc.superclass = superc.prototype;
    subc.prototype.constructor = subc;

    // Reset constructor. See Object Oriented Javascript for an in-depth explanation of this.
    if (superc.prototype.constructor === Object.prototype.constructor) {
        superc.prototype.constructor = superc;
    }

    // los metodos de superc, que no esten en esta clase, crear un metodo que
    // llama al metodo de superc.
    for (var method in subcp) {
        if (subcp.hasOwnProperty(method)) {
            subc.prototype[method] = subcp[method];


            /**
             * Sintactic sugar to add a __super attribute on every overriden method.
             * Despite comvenient, it slows things down by 5fps.
             *
             * Uncomment at your own risk.
             */
            // tenemos en super un metodo con igual nombre.
            if (superc.prototype[method]) {
                subc.prototype[method] = (function (fn, fnsuper) {
                    return function () {
                        var prevMethod = this.__super;

                        this.__super = fnsuper;

                        var retValue = fn.apply(
                            this,
                            Array.prototype.slice.call(arguments));

                        this.__super = prevMethod;

                        return retValue;
                    };
                })(subc.prototype[method], superc.prototype[method]);
            }
        }
    }
};
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    /**
     * @callback tapCallback
     * @param fingers {number} numbers of touch points when the gesture was recognized.
     */

    /**
     * @callback swipeCallback
     * @param fingers {number} numbers of touch points when the gesture was recognized.
     * @param direction {top|left|bottom|right} swipe direction
     */

    /**
     * @callback pinch5Callback
     * @param percentage {number} the relative percentage the gesture is at. 100 is the value at gesture recognition,
     *  and will be smaller as the touch points get closer.
     */

    /**
     * @callback pinchZoomCallback
     * @param data {GM.PinchZoomInfo} Values from pinch and zoom.
     */

    // generic constants
    var TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE= 150;
    var NO_TOUCH_ID= -1;

    function GestureTouchInfo() {
        this.x = -1;
        this.y = -1;
        this.z = -1;
        this.endX = -1;
        this.endY = -1;
        this.endZ = -1;
        this.id= NO_TOUCH_ID;

        this.reset= function() {
            this.id= NO_TOUCH_ID;
        };

        this.initialize= function(id, x, y) {
            this.id= id;
            this.x= x;
            this.y= y;
            this.endX= x;
            this.endY= y;
        };

        this.isReleased= function() {
            return this.id===NO_TOUCH_ID;
        };

        this.isId= function(id) {
            return this.id===id;
        };

        this.getId= function() {
            return this.id;
        };

        this.setEndPosition= function( x,y,z ) {
            this.endX= x;
            this.endY= y;
            this.endZ= z;
        };

        this.dump= function() {
            console.log("   id:"+this.id);
        };

        return this;
    }

    GM.GestureRecognizer= function( callback ) {
        this.status= GM.GestureRecognizer.STATUS.ST_POSSIBLE;
        this.touchesInfo= [];
        this.callback= callback;
        return this;
    };

    GM.GestureRecognizer.STATUS= {
            ST_POSSIBLE :   0,
            ST_BEGAN :      1,
            ST_MOVED :      2,
            ST_ENDED :      3,
            ST_CANCELED :   4,
            ST_FAILED :     5,
            ST_CHANGED :    6
        };

    GM.GestureRecognizer.prototype= {
        status : null,
        id : null,

        touchesInfo : null,
        currentTouchIdCount : -1,

        callback : null,

        startTime : -1,
        fingers : 0,

        setId : function( id ) {
            this.id= id;
        },

        getId : function() {
            return this.id;
        },

        clearTouchId : function(id) {
            var pos= this.getTouchIdPositionInCaptureArray(id);
            if (-1 !== pos ) {
                this.touchesInfo[pos].reset();
            }
        },

        __setStatus : function(st) {
            this.status= st;
        },

        setCaptureTouchIdLen : function(n) {
            this.fingers= n;
            this.touchesInfo= [];
            for( var i=0; i<n; i++ ) {
                this.touchesInfo.push( new GestureTouchInfo() );
            }
            this.currentTouchIdCount=0;
        },

        addTouchInfo : function( ti ) {
            this.touchesInfo[ this.currentTouchIdCount ].initialize( ti.identifier, ti.pageX, ti.pageY );
            this.currentTouchIdCount += 1;
        },

        removeTouchInfoById : function(id) {
            for( var i=0; i<this.touchesInfo.length; i++ ) {
                if( this.touchesInfo[i].getId()===id ) {
                    var touch= this.touchesInfo.splice(i,1)[0];
                    touch.reset();
                    this.touchesInfo.push(touch);
                    this.currentTouchIdCount--;
                    return;
                }
            }
        },

        getCurrentTouchIdCount : function() {
            return this.currentTouchIdCount;
        },

        resetTouchIds : function() {
            this.currentTouchIdCount= 0;
            for( var i=0; i<this.touchesInfo.length; i++ ) {
                this.touchesInfo[i].reset();
            }
            this.log("reset touch ids");
        },

        allCapturedTouchIdsReleased : function() {
            for( var i=0; i<this.touchesInfo.length; i++ ) {
                if ( !this.touchesInfo[i].isReleased() ) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Get a given touch event position in the captured array.
         * -1 if not exists.
         * @param id
         * @return {Number}
         */
        getTouchIdPositionInCaptureArray : function(id) {
            if ( !this.touchesInfo ) {
                return -1;
            }

            for( var i=0; i<this.touchesInfo.length; i++ ) {
                if ( this.touchesInfo[i].isId(id) ) {
                    return i;
                }
            }

            return -1;
        },

        getTouchInfoById : function(id) {
            if ( !this.touchesInfo ) {
                return -1;
            }

            for( var i=0; i<this.touchesInfo.length; i++ ) {
                if ( this.touchesInfo[i].isId(id) ) {
                    return this.touchesInfo[i];
                }
            }

            return null;
        },

        getGestureElapsedTime : function() {
            return new Date().getTime() - this.startTime;
        },

        touchesBegan : function(e) {

            if ( this.startTime===-1 ) {
                this.startTime= new Date().getTime();
            }

            if ( this.getCurrentTouchIdCount() < this.fingers ) {
                if ( this.getGestureElapsedTime() > TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE ) {
                    this.log("too much time until i get all the fingers needed.");
                    this.failed();
                    return;
                }
            }

            if (this.getCurrentTouchIdCount() + e.changedTouches.length>this.fingers) {
                this.log("too many fingers!!");
                this.failed();
                return;
            }

            for( var i=0; i<e.changedTouches.length; i+=1 ) {
                this.addTouchInfo( e.changedTouches[i] );
            }

            if ( this.getCurrentTouchIdCount()===this.fingers ) {
                this.__setStatus( GM.GestureRecognizer.STATUS.ST_BEGAN );
             }
        },

        touchesMoved : function(e) {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_MOVED );
        },

        touchesEnded : function(e) {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_ENDED );
        },

        touchesCanceled : function(e) {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_CANCELED );
            this.failed();
        },

        failed : function() {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_FAILED);
        },

        reset : function() {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_POSSIBLE );
            this.resetTouchIds();
            this.startTime= -1;
        },

        acceptsInput : function() {
            return  !(this.status === GM.GestureRecognizer.STATUS.ST_FAILED ||
                this.status === GM.GestureRecognizer.STATUS.ST_CANCELED ||
                this.status === GM.GestureRecognizer.STATUS.ST_ENDED );
        },

        dumpTouchesInfo : function() {
            for( var i=0; i<this.touchesInfo.length; i+=1) {
                this.touchesInfo[i].dump();
            }
        },

        getStatus : function() {
            return this.status;
        },

        log : function() {
            //console.log( Array.prototype.slice.call(arguments) );
        }
    };

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    /**
     * the gesture for tapping can't take longer than this.
     * this time includes from the time to buffer all fingers (gesture start) to the releasing all fingers.
     *
     * @type {Number}
     */
    var TIME_TO_TAP_FROM_START_TO_END= 150;
    var MOVE_THRESHOLD_TO_CANCEL_GESTURE= 20;

    GM.GR_Tap= function(fingers, callback) {
        GM.GR_Tap.superclass.constructor.call(this, callback);

        fingers= fingers|0;
        this.setCaptureTouchIdLen(fingers);
        this.setId("Tap "+fingers);

        return this;
    };

    GM.GR_Tap.prototype= {

        fingers : 1,

        touchesMoved : function(e) {
            this.__super(e);

            for( var i=0; i<e.changedTouches.length; i+=1 ) {

                var indexId= this.getTouchIdPositionInCaptureArray(e.changedTouches[i].identifier);
                if (-1!=indexId) {

                    var touchInfo= this.touchesInfo[ indexId ];

                    var offsetX= Math.abs( touchInfo.x - e.changedTouches[i].pageX );
                    var offsetY= Math.abs( touchInfo.y - e.changedTouches[i].pageY );

                    if ( offsetX>MOVE_THRESHOLD_TO_CANCEL_GESTURE || offsetY>MOVE_THRESHOLD_TO_CANCEL_GESTURE ) {
                        this.failed();
                        return;
                    }
                }
            }

        },

        touchesEnded : function(e) {
            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }

            var elapsedTime= this.getGestureElapsedTime();

            if ( elapsedTime > TIME_TO_TAP_FROM_START_TO_END ) {
                this.failed();
                return;

            }

            for( var i=0; i<e.changedTouches.length; i+=1 ) {
                this.clearTouchId(e.changedTouches[i].identifier);
            }

            if ( this.allCapturedTouchIdsReleased() ) {
                this.__super(e);
                if ( this.callback ) {
                    this.callback(this.fingers);
                }
            }
        }
    };

    GM.extend( GM.GR_Tap, GM.GestureRecognizer );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    var TIME_TO_FIRE_CALLBACK= 800;

    GM.GR_LongTap= function(fingers, callback) {
        GM.GR_LongTap.superclass.constructor.call(this, fingers, callback);
        this.setId("LongTap "+fingers);

        return this;
    };

    GM.GR_LongTap.prototype= {

        timer : null,

        touchesBegan : function(e) {
            this.__super(e);

            if ( this.getStatus()===GM.GestureRecognizer.STATUS.ST_BEGAN ) {
                this.__cancelTimer();
                this.timer= setTimeout( this.__fireEvent.bind(this), TIME_TO_FIRE_CALLBACK);
            }
        },

        __fireEvent : function() {
            if ( this.callback ) {
                this.callback(this.fingers);
            }
        },

        touchesEnded : function(e) {
            this.__cancelTimer();
        },

        failed : function() {
            this.__super();
            this.__cancelTimer();
        },

        __cancelTimer : function() {
            if ( this.timer ) {
                clearTimeout( this.timer );
                this.timer=0;
            }
        }

    };

    GM.extend( GM.GR_LongTap, GM.GR_Tap );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    var DOUBLE_TAP_MAX_TIME= 200;
    var TIME_TO_TAP_FROM_START_TO_END= 100;

    GM.GR_DoubleTap= function(fingers, callback) {
        GM.GR_DoubleTap.superclass.constructor.call(this, fingers, callback);
        this.setId("DoubleTap");

        return this;
    };

    GM.GR_DoubleTap.prototype= {

        prevTime : 0,

        touchesEnded : function(e) {
            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.prevTime=0;
                this.failed();
                return;
            }

            var elapsedTime= this.getGestureElapsedTime();

            if ( elapsedTime > TIME_TO_TAP_FROM_START_TO_END ) {
                this.prevTime=0;
                this.failed();
                return;

            }

            for( var i=0; i<e.changedTouches.length; i+=1 ) {
                this.clearTouchId(e.changedTouches[i].identifier);
            }

            if ( this.allCapturedTouchIdsReleased() ) {

                var t= new Date().getTime();
                if ( t - this.prevTime < DOUBLE_TAP_MAX_TIME ) {
                    if ( this.callback ) {
                        this.callback(this.fingers);
                    }
                }

                this.prevTime= t;
            }
        }

    };

    GM.extend( GM.GR_DoubleTap, GM.GR_Tap );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    var MIN_CONTOUR_RATIO_TO_PINCH5= 0.94;

    GM.GR_Pinch5= function(callback) {
        GM.GR_Pinch5.superclass.constructor.call(this, callback);
        this.setCaptureTouchIdLen(5);
        this.setId("Pinch5");

        return this;
    };

    GM.GR_Pinch5.prototype= {

        contour : 0,
        started : false,

        touchesBegan : function(e) {
            this.__super(e);
            if ( this.getStatus()===GM.GestureRecognizer.STATUS.ST_BEGAN ) {
                this.contour= this.__getContourLength();
            }
        },

        __getContourLength : function() {
            var contour= 0;
            var ti0= this.touchesInfo[0];
            var ti1;

            for( var i=1; i<=this.touchesInfo.length; i+=1 ) {
                ti1= this.touchesInfo[i%this.touchesInfo.length];
                contour+= Math.sqrt( (ti1.endX-ti0.endX)*(ti1.endX-ti0.endX) + (ti1.endY-ti0.endY)*(ti1.endY-ti0.endY) );
            }

            return contour;
        },

        touchesMoved : function(e) {

            var i;

            if ( !this.acceptsInput() ) {
                return;
            }

            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var touch= e.changedTouches[i];
                var id= touch.identifier;
                var touchInfo= this.getTouchInfoById(id);
                if (touchInfo) {
                    touchInfo.setEndPosition(touch.pageX, touch.pageY, 0);
                }
            }

            var contour= this.__getContourLength();
            var ratio= contour/this.contour;

            if (!this.started) {
                if ( contour/this.contour < MIN_CONTOUR_RATIO_TO_PINCH5 ) {
                    this.started= true;
                    this.__notify(ratio);
                }
            } else {
                this.__notify(ratio);
            }
        },

        __notify : function( ratio ) {
            if ( this.callback ) {
                this.callback( ratio );
            }
        },

        touchesEnded : function(e) {

            if (!this.started) {
                this.failed();
                return;
            }

            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }

            for( var i=0; i<e.changedTouches.length; i+=1 ) {
                this.clearTouchId(e.changedTouches[i].identifier);
            }

            if ( this.allCapturedTouchIdsReleased() ) {
                this.__super(e);
                if ( this.callback ) {
                    this.callback( 0 );
                }
            }
        },

        reset : function() {
            this.__super();
            this.started= false;
        }
    };

    GM.extend( GM.GR_Pinch5, GM.GestureRecognizer );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    var DISTANCE_THRESHOLD_TO_BE_PINCHZOOM= 20;
    var TIME_TO_START_PINCH_ZOOM= 700;

    /**
     * @class
     *
     * @name PinchZoomInfo
     * @memberOf GM
     *
     * Info for pinch and zoom gesture.
     *
     * @constructor
     */
    GM.PinchZoomInfo = function( scale, rotation, x, y) {

        /**
         * @memberOf GM.PinchZoomInfo.prototype
         * @name scale
         * @type {number}
         */
        this.scale = scale;

        /**
         * @memberOf GM.PinchZoomInfo.prototype
         * @name rotation
         * @type {number}
         */
        this.rotation= rotation;

        /**
         * @memberOf GM.PinchZoomInfo.prototype
         * @name translate
         * @type { {x:number, y:number} }
         */
        this.translate= {
            x : x,
            y : y
        };

        return this;
    };

    GM.GR_PinchZoom= function(callback) {
        GM.GR_PinchZoom.superclass.constructor.call(this, callback);
        this.setCaptureTouchIdLen(2);
        this.setId("Pinch and Zoom");

        return this;
    };

    GM.GR_PinchZoom.prototype= {

        __gestureRotation : 0,
        __gestureScale : 0,

        __scale : 1,
        __rotation : 0,

        started : false,

        touchesBegan : function(e) {
            this.__super(e);

            if ( this.getStatus()===GM.GestureRecognizer.STATUS.ST_BEGAN ) {

                var e0= this.touchesInfo[0];
                var e1= this.touchesInfo[1];

                this.__scale= 1;
                this.__rotation= 0;
                this.__gestureScale= Math.sqrt( (e1.y-e0.y)*(e1.y-e0.y) + (e1.x-e0.x)*(e1.x-e0.x) );
                this.__gestureRotation= Math.atan2( e1.y-e0.y, e1.x-e0.x );

            }
        },

        __isValidDistance : function( touchInfo ) {
            var y= touchInfo.endY - touchInfo.y;
            var x= touchInfo.endX - touchInfo.x;

            return Math.sqrt(x*x + y*y) > DISTANCE_THRESHOLD_TO_BE_PINCHZOOM;
        },

        touchesMoved : function(e) {

            var i;

            if ( !this.acceptsInput() ) {
                return;
            }

            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var touch= e.changedTouches[i];
                var id= touch.identifier;
                var touchInfo= this.getTouchInfoById(id);
                if (touchInfo) {
                    touchInfo.setEndPosition(touch.pageX, touch.pageY, 0);

                }
            }

            if (!this.started) {
                if ( this.getGestureElapsedTime() > TIME_TO_START_PINCH_ZOOM ) {
                    this.failed();
                    return;
                }

                for( i=0; i<this.touchesInfo.length; i++ ) {
                    if ( !this.__isValidDistance(this.touchesInfo[i]) ) {
                        return;
                    }
                }
                this.started= true;
            }

            this.__super(e);


            var e0= this.touchesInfo[0];
            var e1= this.touchesInfo[1];

            var gr= Math.atan2( e1.endY-e0.endY, e1.endX-e0.endX );
            this.__rotation+= gr - this.__gestureRotation;
            this.__gestureRotation= gr;

            var gs= Math.sqrt( (e1.endY-e0.endY)*(e1.endY-e0.endY) + (e1.endX-e0.endX)*(e1.endX-e0.endX) );

            var sc= this.__scale + ( gs/this.__gestureScale ) - 1;

            if ( sc<0.2 ) {
                this.__scale= 0.2;
            } else {
                this.__scale = sc;
                this.__gestureScale= gs;
            }

            var tx = e0.endX - e0.x;
            var ty = e0.endY - e0.y;

            if ( this.callback ) {
                this.callback( new GM.PinchZoomInfo( this.__scale, this.__rotation*180/Math.PI, tx, ty ) );
            }
        },

        touchesEnded : function(e) {
            if ( !this.allCapturedTouchIdsReleased() ) {
                this.failed();
            } else {
                this.__super(e);
            }
        },

        reset : function() {
            this.__super();
            this.started= false;
        }

    };

    GM.extend( GM.GR_PinchZoom, GM.GestureRecognizer );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */


(function() {

    var ANGLE= Math.PI/12;
    var DISTANCE_THRESHOLD_TO_BE_SWIPE= 100;    // pixels to consider swipe.
    var TIME_TO_CONSIDER_VALID_SWIPE= 300;

    GM.GR_Swipe= function(fingers, callback) {
        GM.GR_Swipe.superclass.constructor.call(this, callback);

        if ( fingers ) {
            this.fingers= fingers|0;
        }

        this.setCaptureTouchIdLen(fingers);

        this.setId("Swipe "+fingers);

        return this;
    };

    GM.GR_Swipe.DIRECTION = {
            LEFT : "left",
            RIGHT : "right",
            DOWN : "down",
            UP : "up",
            CANT_TELL : "can't tell"
        };

    GM.GR_Swipe.prototype= {

        touchesEnded : function(e) {

            var i;

            if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }

            if ( this.getGestureElapsedTime() > TIME_TO_CONSIDER_VALID_SWIPE ) {
                this.failed();
                return;
            }

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var touch= e.changedTouches[i];
                var id= touch.identifier;

                var touchInfo= this.getTouchInfoById(id);
                if (touchInfo) {
                    touchInfo.setEndPosition(touch.pageX, touch.pageY, 0);
                    if (!this.__isValidDistance( touchInfo )) {
                        this.failed();
                        return;
                    }
                }

                this.clearTouchId(id);
            }

            if ( this.allCapturedTouchIdsReleased() ) {

                // only angle for touch 0
                var swipe_dir= this.__getSwipeDirection( this.touchesInfo[0] );
                for( i=1; i<this.getCurrentTouchIdCount(); i+=1 ) {
                    if ( swipe_dir!==this.__getSwipeDirection(this.touchesInfo[i]) ) {
                        this.failed();
                        return;
                    }
                }

                this.__super(e);
                if ( this.callback ) {
                    this.callback(this.fingers, swipe_dir);
                }
            }
        },

        __isValidDistance : function( touchInfo ) {
            var y= touchInfo.endY - touchInfo.y;
            var x= touchInfo.endX - touchInfo.x;

            return Math.sqrt(x*x + y*y) > DISTANCE_THRESHOLD_TO_BE_SWIPE;
        },

        __getSwipeDirection : function( touchInfo ) {
            var yy= touchInfo.endY - touchInfo.y;
            var angle= Math.abs(Math.atan2( yy, touchInfo.endX - touchInfo.x ));

            if ( angle>=0 && angle<ANGLE ) {
                return GM.GR_Swipe.DIRECTION.RIGHT;
            } else if (angle<Math.PI && angle>Math.PI - ANGLE) {
                return GM.GR_Swipe.DIRECTION.LEFT;
            } else if ( angle>=Math.PI/2-ANGLE && angle<Math.PI/2+ANGLE ) {
                return yy<0 ? GM.GR_Swipe.DIRECTION.UP : GM.GR_Swipe.DIRECTION.DOWN;
            }

            return GM.GR_Swipe.DIRECTION.CANT_TELL;
        }

    };

    GM.extend( GM.GR_Swipe, GM.GestureRecognizer );

})();
/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 * *
 * @see LICENSE file
 *
 */


(function() {

    /**
     * @class
     *
     *
     *
     * @name GestureManager
     * @memberOf GM
     * @constructor
     */
    GM.GestureManager= function( target ) {
        this.gestureRecognizerList= [];
        this.touchIds= [];
        this.target= null;

        if ( target ) {
            this.__setTarget( target );
        }

        return this;
    };

    GM.GestureManager.prototype= {

        __findIdPos : function(id) {

            for( var i=0; i<this.touchIds.length; i++ ) {
                if ( this.touchIds[i]===id ) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * @deprecated
         * @param target {HTMLElement}
         */
        setTarget : function( target ) {
            return this.__setTarget( target );
        },

        /**
         * Set this gesture recognizer target element.
         * @param target {HTMLElement}
         * @returns {this}
         */
        __setTarget : function( target ) {
            if ( this.target ) {
                this.target.removeEventListener("touchstart");
                this.target.removeEventListener("touchmove");
                this.target.removeEventListener("touchend");
                this.target.removeEventListener("touchcancel");

                this.target.removeEventListener("MozTouchDown");
                this.target.removeEventListener("MozTouchMove");
                this.target.removeEventListener("MozTouchRelease");
                this.target.removeEventListener("MozTouchCancel");
            }

            this.target= target;

            target.addEventListener("touchstart",  this.__touchStartHandler.bind(this), false);
            target.addEventListener("touchmove",   this.__touchMoveHandler.bind(this), false);
            target.addEventListener("touchend",    this.__touchEndHandler.bind(this),  false);
            target.addEventListener("touchcancel", this.__touchCancelHandler.bind(this), false);

            target.addEventListener("MozTouchDown",  this.__touchStartHandler.bind(this), false);
            target.addEventListener("MozTouchMove",   this.__touchMoveHandler.bind(this), false);
            target.addEventListener("MozTouchRelease",    this.__touchEndHandler.bind(this),  false);
            target.addEventListener("MozTouchCancel", this.__touchCancelHandler.bind(this), false);

            return this;
        },

        __touchStartHandler : function(e) {
            e.preventDefault();

            var i;

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var id= e.changedTouches[i].identifier;
                if ( this.__findIdPos(id)===-1 ) {
                    this.touchIds.push(id);
                }
            }

            for( i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesBegan(e);
                }
            }
        },

        __touchMoveHandler : function(e) {
            e.preventDefault();

            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesMoved(e);
                }
            }
        },

        __touchEndHandler : function(e) {

            var i;

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var id= e.changedTouches[i].identifier;
                var pos= this.__findIdPos(id);
                if ( pos!==-1 ) {
                    this.touchIds.splice(pos,1);
                }
            }


            e.preventDefault();

            for( i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesEnded(e);
                }
            }

            this.__shouldReset(e);
        },

        __touchCancelHandler : function(e) {

            var i;

            for( i=0; i<e.changedTouches.length; i+=1 ) {
                var id= e.changedTouches[i].identifier;
                var pos= this.__findIdPos(id);
                if ( pos!==-1 ) {
                    this.touchIds.splice(pos,1);
                }
            }

            e.preventDefault();

            for( i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesCanceled(e);
                }
            }

            this.__shouldReset(e);
        },

        __shouldReset : function(e) {
            if (this.touchIds.length===0) {
                this.__resetGestureRecognizers();
            }
        },

        /**
         * Use this method to add a new gesture recognizer. Preferably use the onXXX methods.
         * @param gr {GM.GestureRecognizer}
         * @returns {GM.GestureManager}
         */
        addGestureRecognizer : function( gr ) {
            this.gestureRecognizerList.push( gr );
            return this;
        },

        __resetGestureRecognizers : function() {
            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                this.gestureRecognizerList[i].reset();
            }
        },


        /**
         *
         * @param callback {tapCallback}
         */
        onTap : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Tap(1, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onTap2 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Tap(2, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onTap3 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Tap(3, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onTap4 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Tap(4, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onTap5 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Tap(5, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onLongTap : function( callback ) {
            this.addGestureRecognizer( new GM.GR_LongTap(1, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onLongTap2 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_LongTap(2, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onLongTap3 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_LongTap(3, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onLongTap4 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_LongTap(4, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onLongTap5 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_LongTap(5, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onDoubleTap : function( callback ) {
            this.addGestureRecognizer( new GM.GR_DoubleTap(1, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onDoubleTap2 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_DoubleTap(2, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onDoubleTap3 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_DoubleTap(3, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onDoubleTap4 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_DoubleTap(4, callback ) );
        },

        /**
         *
         * @param callback {tapCallback}
         */
        onDoubleTap5 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_DoubleTap(5, callback ) );
        },

        /**
         *
         * @param callback {swipeCallback}
         */
        onSwipe : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Swipe(1, callback ) );
        },

        /**
         *
         * @param callback {swipeCallback}
         */
        onSwipe2 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Swipe(2, callback ) );
        },

        /**
         *
         * @param callback {swipeCallback}
         */
        onSwipe3 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Swipe(3, callback ) );
        },

        /**
         *
         * @param callback {swipeCallback}
         */
        onSwipe4 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Swipe(4, callback ) );
        },

        /**
         *
         * @param callback {swipeCallback}
         */
        onSwipe5 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Swipe(5, callback ) );
        },

        /**
         *
         * @param callback {pinchZoomCallback}
         */
        onPinchZoom : function( callback ) {
            this.addGestureRecognizer( new GM.GR_PinchZoom( callback ) );
        },

        /**
         * This is the ipad multitask 5 touch close up gesture
         * @param callback {pinch5Callback}
         */
        onPinch5 : function( callback ) {
            this.addGestureRecognizer( new GM.GR_Pinch5( callback ) );
        }
    };

})();