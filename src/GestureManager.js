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