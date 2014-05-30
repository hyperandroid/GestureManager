var GM = window.GM || {};

GM.extend = function (subc, superc) {
    var subcp = subc.prototype;

    // Class pattern.
    var f = function () {
    };
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