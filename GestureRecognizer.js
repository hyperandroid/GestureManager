/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 *
 * @see LICENSE file
 *
 */

(function() {

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
/*
        touchesBegan : function(e) {
            this.__setStatus( GM.GestureRecognizer.STATUS.ST_BEGAN );
            this.startTime= new Date().getTime();
        },
*/
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