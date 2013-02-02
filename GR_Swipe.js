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
                return yy<0 ? GM.GR_Swipe.DIRECTION.UP : GM.GR_Swipe.DIRECTION.DOWN
            }

            return GM.GR_Swipe.DIRECTION.CANT_TELL;
        }

    };

    GM.extend( GM.GR_Swipe, GM.GestureRecognizer );

})();