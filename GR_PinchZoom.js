/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    GM.GR_PinchZoom= function(callback) {
        GM.GR_PinchZoom.superclass.constructor.call(this, callback);

        this.fingers= 2;
        this.setCaptureTouchIdLen(this.fingers);
        this.setId("Pinch and Zoom");

        return this;
    };

    GM.GR_PinchZoom.prototype= {

        __gestureRotation : 0,
        __gestureScale : 0,

        __scale : 1,
        __rotation : 0,

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

        touchesMoved : function(e) {

            if ( !this.acceptsInput() ) {
                return;
            }

            this.__super(e);

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

            var e0= this.touchesInfo[0];
            var e1= this.touchesInfo[1];

            var gr= Math.atan2( e1.endY-e0.endY, e1.endX-e0.endX );
            this.__rotation+= gr - this.__gestureRotation;
            this.__gestureRotation= gr;

            var gs= Math.sqrt( (e1.endY-e0.endY)*(e1.endY-e0.endY) + (e1.endX-e0.endX)*(e1.endX-e0.endX) );

            var sc= this.__scale + ( gs/this.__gestureScale ) - 1;

            if ( sc<.2 ) {
                this.__scale= .2;
            } else {
                this.__scale = sc;
                this.__gestureScale= gs;
            }

            var tx = e0.endX - e0.x;
            var ty = e0.endY - e0.y;

            if ( this.callback ) {
                this.callback( {
                    scale : this.__scale,
                    rotation : this.__rotation*180/Math.PI,
                    translate : {
                        x : tx,
                        y : ty
                    }
                });
            }
        },

        touchesEnded : function(e) {
            if ( !this.allCapturedTouchIdsReleased() ) {
                this.failed();
            } else {
                this.__super(e);
            }
        },

        touchesCanceled : function(e) {
            this.__super(e);
            this.failed();
        },

        reset : function() {
            this.__super();
        }

    };

    GM.extend( GM.GR_PinchZoom, GM.GestureRecognizer );

})();