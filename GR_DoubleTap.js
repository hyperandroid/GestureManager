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