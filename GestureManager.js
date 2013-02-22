/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 * *
 * @see LICENSE file
 *
 */


(function() {

    GM.GestureManager= function() {
        this.gestureRecognizerList= [];
        this.touchIds= [];
        return this;
    };

    GM.GestureManager.prototype= {
        target : null,
        gestureRecognizerList : null,
        touchIds : null,

        findIdPos : function(id) {

            for( var i=0; i<this.touchIds.length; i++ ) {
                if ( this.touchIds[i]===id ) {
                    return i;
                }
            }

            return -1;
        },

        setTarget : function( target ) {
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
                if ( this.findIdPos(id)===-1 ) {
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
                var pos= this.findIdPos(id);
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
                var pos= this.findIdPos(id);
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

        addGestureRecognizer : function( gr ) {
            this.gestureRecognizerList.push( gr );
            return this;
        },

        __resetGestureRecognizers : function() {
            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                this.gestureRecognizerList[i].reset();
            }
        }
    };

})();