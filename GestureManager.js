/**
 * GestureManager : an extensible multitouch gesture recognizer for javascript
 * *
 * @see LICENSE file
 *
 */


(function() {

    var gestureRecognizerList= [];

    window.addEventListener("touchstart",  __touchStartHandler, false);
    window.addEventListener("touchmove",   __touchMoveHandler, false);
    window.addEventListener("touchend",    __touchEndHandler,  false);
    window.addEventListener("touchcancel", __touchCancelHandler, false);

    function __touchStartHandler(e) {
        e.preventDefault();

        for( var i=0; i<gestureRecognizerList.length; i+=1 ) {
            if ( gestureRecognizerList[i].acceptsInput() ) {
                gestureRecognizerList[i].touchesBegan(e);
            }
        }
    };

    function __touchMoveHandler(e) {
        e.preventDefault();

        for( var i=0; i<gestureRecognizerList.length; i+=1 ) {
            if ( gestureRecognizerList[i].acceptsInput() ) {
                gestureRecognizerList[i].touchesMoved(e);
            }
        }
    };

    function __touchEndHandler(e) {

        e.preventDefault();

        for( var i=0; i<gestureRecognizerList.length; i+=1 ) {
            if ( gestureRecognizerList[i].acceptsInput() ) {
                gestureRecognizerList[i].touchesEnded(e);
            }
        }

        __shouldReset(e);
    };

    function __touchCancelHandler(e) {

        e.preventDefault();

        for( var i=0; i<gestureRecognizerList.length; i+=1 ) {
            if ( gestureRecognizerList[i].acceptsInput() ) {
                gestureRecognizerList[i].touchesCanceled(e);
            }
        }

        __shouldReset(e);
    };

    function __shouldReset(e) {
        if (e.touches.length===0) {
            __resetGestureRecognizers();
        }

    };

    function __addGestureRecognizer( gr ) {
        gestureRecognizerList.push( gr );
        return this;
    };

    function __resetGestureRecognizers() {
        for( var i=0; i<gestureRecognizerList.length; i+=1 ) {
            gestureRecognizerList[i].reset();
        }
    }


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

    GM.GestureManager= {
        addGestureRecognizer : __addGestureRecognizer
    };

})();