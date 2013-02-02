/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 * *
 * @see LICENSE file
 *
 */


(function() {

    GM.GestureManager= function() {
        this.gestureRecognizerList= [];
        return this;
    };

    GM.GestureManager.prototype= {
        target : null,
        gestureRecognizerList : null,

        setTarget : function( target ) {
            if ( this.target ) {
                this.target.removeEventListener("touchstart");
                this.target.removeEventListener("touchmove");
                this.target.removeEventListener("touchend");
                this.target.removeEventListener("touchcancel");
            }

            this.target= target;

            target.addEventListener("touchstart",  this.__touchStartHandler.bind(this), false);
            target.addEventListener("touchmove",   this.__touchMoveHandler.bind(this), false);
            target.addEventListener("touchend",    this.__touchEndHandler.bind(this),  false);
            target.addEventListener("touchcancel", this.__touchCancelHandler.bind(this), false);

            return this;
        },

        __touchStartHandler : function(e) {
            e.preventDefault();

            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
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

            e.preventDefault();

            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesEnded(e);
                }
            }

            this.__shouldReset(e);
        },

        __touchCancelHandler : function(e) {

            e.preventDefault();

            for( var i=0; i<this.gestureRecognizerList.length; i+=1 ) {
                if ( this.gestureRecognizerList[i].acceptsInput() ) {
                    this.gestureRecognizerList[i].touchesCanceled(e);
                }
            }

            this.__shouldReset(e);
        },

        __shouldReset : function(e) {
            if (e.touches.length===0) {
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


    GM.extend = function (subc, superc) {
       var subcp = subc.prototype;

       // Class pattern.
       var f= function () {};
       f.prototype = superc.prototype;

       subc.prototype = new f();       // chain prototypes.
       subc.superclass = superc.prototype;
       subc.prototype.constructor = subc;

       // Reset constructor. See Object Oriented Javascript for an in-depth explanation of this.
       if (superc.prototype.constructor === Object.prototype.constructor) {
           superc.prototype.constructor = superc;
       }

       // los metodos de superc, que no esten en esta clase, crear un metodo que
       // llama al metodo de superc.
       for (var method in subcp) {
           if (subcp.hasOwnProperty(method)) {
               subc.prototype[method] = subcp[method];


               /**
                * Sintactic sugar to add a __super attribute on every overriden method.
                * Despite comvenient, it slows things down by 5fps.
                *
                * Uncomment at your own risk.
                */
               // tenemos en super un metodo con igual nombre.
               if (superc.prototype[method]) {
                   subc.prototype[method] = (function (fn, fnsuper) {
                       return function () {
                           var prevMethod = this.__super;

                           this.__super = fnsuper;

                           var retValue = fn.apply(
                               this,
                               Array.prototype.slice.call(arguments));

                           this.__super = prevMethod;

                           return retValue;
                       };
                   })(subc.prototype[method], superc.prototype[method]);
               }
           }
       }
   };

})();