/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

    var MIN_CONTOUR_RATIO_TO_PINCH5= .94;

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