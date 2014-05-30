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