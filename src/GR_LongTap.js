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