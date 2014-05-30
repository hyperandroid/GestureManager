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