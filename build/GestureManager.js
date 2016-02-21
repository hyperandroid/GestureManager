var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NO_TOUCH_ID = -1;
var TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE = 150;
var TAP_TIME_TO_TAP_FROM_START_TO_END = 150;
var MOVE_THRESHOLD_TO_CANCEL_GESTURE = 20;
var DOUBLE_TAP_MAX_TIME = 200;
var DOUBLETAP_TIME_TO_TAP_FROM_START_TO_END = 100;
var LONGTAP_TIME_TO_FIRE_CALLBACK = 800;
var SWIPE_RECOGNIZER_ANGLE_THRESHOLD = Math.PI / 12;
var DISTANCE_THRESHOLD_TO_BE_SWIPE = 100;
var TIME_TO_CONSIDER_VALID_SWIPE = 300;
var MIN_CONTOUR_RATIO_TO_PINCH5 = 0.94;
var DISTANCE_THRESHOLD_TO_BE_PINCHZOOM = 20;
var TIME_TO_START_PINCH_ZOOM = 700;
var SwipeDirection = {
    LEFT: "left",
    RIGHT: "right",
    DOWN: "down",
    UP: "up",
    CANT_TELL: "can't tell"
};
var GestureTouchInfo = (function () {
    function GestureTouchInfo() {
        this._x = -1;
        this._y = -1;
        this._endX = -1;
        this._endY = -1;
        this._id = NO_TOUCH_ID;
        return this;
    }
    Object.defineProperty(GestureTouchInfo.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GestureTouchInfo.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GestureTouchInfo.prototype, "endX", {
        get: function () {
            return this._endX;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GestureTouchInfo.prototype, "endY", {
        get: function () {
            return this._endY;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GestureTouchInfo.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    GestureTouchInfo.prototype.reset = function () {
        this._id = NO_TOUCH_ID;
    };
    GestureTouchInfo.prototype.initialize = function (id, x, y) {
        this._id = id;
        this._x = x;
        this._y = y;
        this._endX = x;
        this._endY = y;
    };
    GestureTouchInfo.prototype.isReleased = function () {
        return this._id === NO_TOUCH_ID;
    };
    GestureTouchInfo.prototype.isId = function (id) {
        return this._id === id;
    };
    GestureTouchInfo.prototype.setEndPosition = function (x, y) {
        this._endX = x;
        this._endY = y;
    };
    GestureTouchInfo.prototype.isValidDistance = function (d) {
        var y = this._endY - this._y;
        var x = this._endX - this._x;
        return Math.sqrt(x * x + y * y) > d;
    };
    return GestureTouchInfo;
})();
var GestureStatus;
(function (GestureStatus) {
    GestureStatus[GestureStatus["ST_POSSIBLE"] = 0] = "ST_POSSIBLE";
    GestureStatus[GestureStatus["ST_BEGAN"] = 1] = "ST_BEGAN";
    GestureStatus[GestureStatus["ST_MOVED"] = 2] = "ST_MOVED";
    GestureStatus[GestureStatus["ST_ENDED"] = 3] = "ST_ENDED";
    GestureStatus[GestureStatus["ST_CANCELED"] = 4] = "ST_CANCELED";
    GestureStatus[GestureStatus["ST_FAILED"] = 5] = "ST_FAILED";
})(GestureStatus || (GestureStatus = {}));
var GestureRecognizer = (function () {
    function GestureRecognizer(callback) {
        this._status = GestureStatus.ST_POSSIBLE;
        this._touchesInfo = [];
        this._callback = callback;
        this._id = "";
        this._startTime = -1;
        this._fingers = 0;
        this._currentTouchIdCount = -1;
        return this;
    }
    ;
    Object.defineProperty(GestureRecognizer.prototype, "id", {
        get: function () {
            return this._id;
        },
        set: function (id) {
            this._id = id;
        },
        enumerable: true,
        configurable: true
    });
    GestureRecognizer.prototype.clearTouchId = function (id) {
        var pos = this.getTouchIdPositionInCaptureArray(id);
        if (-1 !== pos) {
            this._touchesInfo[pos].reset();
        }
    };
    GestureRecognizer.prototype.__setStatus = function (st) {
        this._status = st;
    };
    GestureRecognizer.prototype.setCaptureTouchIdLen = function (n) {
        this._fingers = n;
        this._touchesInfo = [];
        for (var i = 0; i < n; i++) {
            this._touchesInfo.push(new GestureTouchInfo());
        }
        this._currentTouchIdCount = 0;
    };
    GestureRecognizer.prototype.addTouchInfo = function (ti) {
        this._touchesInfo[this._currentTouchIdCount].initialize(ti.identifier, ti.pageX, ti.pageY);
        this._currentTouchIdCount += 1;
    };
    GestureRecognizer.prototype.getCurrentTouchIdCount = function () {
        return this._currentTouchIdCount;
    };
    GestureRecognizer.prototype.resetTouchIds = function () {
        this._currentTouchIdCount = 0;
        this._touchesInfo.forEach(function (ti) {
            ti.reset();
        });
    };
    GestureRecognizer.prototype.allCapturedTouchIdsReleased = function () {
        for (var i = 0; i < this._touchesInfo.length; i++) {
            if (!this._touchesInfo[i].isReleased()) {
                return false;
            }
        }
        return true;
    };
    GestureRecognizer.prototype.getTouchIdPositionInCaptureArray = function (id) {
        if (!this._touchesInfo) {
            return -1;
        }
        for (var i = 0; i < this._touchesInfo.length; i++) {
            if (this._touchesInfo[i].isId(id)) {
                return i;
            }
        }
        return -1;
    };
    GestureRecognizer.prototype.getTouchInfoById = function (id) {
        if (!this._touchesInfo) {
            return null;
        }
        for (var i = 0; i < this._touchesInfo.length; i++) {
            if (this._touchesInfo[i].isId(id)) {
                return this._touchesInfo[i];
            }
        }
        return null;
    };
    GestureRecognizer.prototype.getGestureElapsedTime = function () {
        return new Date().getTime() - this._startTime;
    };
    GestureRecognizer.prototype.touchesBegan = function (e) {
        if (this._startTime === -1) {
            this._startTime = new Date().getTime();
        }
        if (this.getCurrentTouchIdCount() < this._fingers) {
            if (this.getGestureElapsedTime() > TIME_TO_HAVE_ALL_FINGERS_IN_GESTURE) {
                this.failed();
                return;
            }
        }
        if (this.getCurrentTouchIdCount() + e.changedTouches.length > this._fingers) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            this.addTouchInfo(e.changedTouches[i]);
        }
        if (this.getCurrentTouchIdCount() === this._fingers) {
            this.__setStatus(GestureStatus.ST_BEGAN);
        }
    };
    GestureRecognizer.prototype.touchesMoved = function (e) {
        this.__setStatus(GestureStatus.ST_MOVED);
    };
    GestureRecognizer.prototype.touchesEnded = function (e) {
        this.__setStatus(GestureStatus.ST_ENDED);
    };
    GestureRecognizer.prototype.touchesCanceled = function (e) {
        this.__setStatus(GestureStatus.ST_CANCELED);
        this.failed();
    };
    GestureRecognizer.prototype.failed = function () {
        this.__setStatus(GestureStatus.ST_FAILED);
    };
    GestureRecognizer.prototype.reset = function () {
        this.__setStatus(GestureStatus.ST_POSSIBLE);
        this.resetTouchIds();
        this._startTime = -1;
    };
    GestureRecognizer.prototype.acceptsInput = function () {
        return !(this._status === GestureStatus.ST_FAILED ||
            this._status === GestureStatus.ST_CANCELED ||
            this._status === GestureStatus.ST_ENDED);
    };
    GestureRecognizer.prototype.getStatus = function () {
        return this._status;
    };
    return GestureRecognizer;
})();
var GR_Tap = (function (_super) {
    __extends(GR_Tap, _super);
    function GR_Tap(fingers, callback) {
        _super.call(this, callback);
        fingers = fingers | 0;
        this.setCaptureTouchIdLen(fingers);
        this.id = "Tap " + fingers;
        return this;
    }
    GR_Tap.prototype.touchesMoved = function (e) {
        _super.prototype.touchesMoved.call(this, e);
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var indexId = this.getTouchIdPositionInCaptureArray(e.changedTouches[i].identifier);
            if (-1 != indexId) {
                var touchInfo = this._touchesInfo[indexId];
                var offsetX = Math.abs(touchInfo.x - e.changedTouches[i].pageX);
                var offsetY = Math.abs(touchInfo.y - e.changedTouches[i].pageY);
                if (offsetX > MOVE_THRESHOLD_TO_CANCEL_GESTURE || offsetY > MOVE_THRESHOLD_TO_CANCEL_GESTURE) {
                    this.failed();
                    return;
                }
            }
        }
    };
    GR_Tap.prototype.touchesEnded = function (e) {
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this.failed();
            return;
        }
        var elapsedTime = this.getGestureElapsedTime();
        if (elapsedTime > TAP_TIME_TO_TAP_FROM_START_TO_END) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }
        if (this.allCapturedTouchIdsReleased()) {
            _super.prototype.touchesEnded.call(this, e);
            this._callback && this._callback(this._fingers);
        }
    };
    return GR_Tap;
})(GestureRecognizer);
var GR_DoubleTap = (function (_super) {
    __extends(GR_DoubleTap, _super);
    function GR_DoubleTap(fingers, callback) {
        _super.call(this, fingers, callback);
        this.id = "DoubleTap";
        this._prevTime = 0;
        return this;
    }
    GR_DoubleTap.prototype.touchesEnded = function (e) {
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this._prevTime = 0;
            this.failed();
            return;
        }
        var elapsedTime = this.getGestureElapsedTime();
        if (elapsedTime > DOUBLETAP_TIME_TO_TAP_FROM_START_TO_END) {
            this._prevTime = 0;
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }
        if (this.allCapturedTouchIdsReleased()) {
            var t = new Date().getTime();
            if (t - this._prevTime < DOUBLE_TAP_MAX_TIME) {
                if (this._callback) {
                    this._callback(this._fingers);
                }
            }
            this._prevTime = t;
        }
    };
    return GR_DoubleTap;
})(GR_Tap);
var GR_LongTap = (function (_super) {
    __extends(GR_LongTap, _super);
    function GR_LongTap(fingers, callback) {
        _super.call(this, fingers, callback);
        this.id = "LongTap " + fingers;
        this._timer = -1;
        return this;
    }
    GR_LongTap.prototype.touchesBegan = function (e) {
        _super.prototype.touchesBegan.call(this, e);
        if (this.getStatus() === GestureStatus.ST_BEGAN) {
            this.__cancelTimer();
            this._timer = setTimeout(this.__fireEvent.bind(this), LONGTAP_TIME_TO_FIRE_CALLBACK);
        }
    };
    GR_LongTap.prototype.__fireEvent = function () {
        if (this._callback) {
            this._callback(this._fingers);
        }
    };
    GR_LongTap.prototype.touchesEnded = function (e) {
        this.__cancelTimer();
    };
    GR_LongTap.prototype.failed = function () {
        _super.prototype.failed.call(this);
        this.__cancelTimer();
    };
    GR_LongTap.prototype.__cancelTimer = function () {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = -1;
        }
    };
    return GR_LongTap;
})(GR_Tap);
var GR_Swipe = (function (_super) {
    __extends(GR_Swipe, _super);
    function GR_Swipe(fingers, callback) {
        _super.call(this, callback);
        this._fingers = fingers | 0;
        this.id = "Swipe " + fingers;
        this.setCaptureTouchIdLen(fingers);
        return this;
    }
    GR_Swipe.prototype.touchesEnded = function (e) {
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this.failed();
            return;
        }
        if (this.getGestureElapsedTime() > TIME_TO_CONSIDER_VALID_SWIPE) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var touch = e.changedTouches[i];
            var id = touch.identifier;
            var touchInfo = this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
                if (!touchInfo.isValidDistance(DISTANCE_THRESHOLD_TO_BE_SWIPE)) {
                    this.failed();
                    return;
                }
            }
            this.clearTouchId(id);
        }
        if (this.allCapturedTouchIdsReleased()) {
            var swipe_dir = this.__getSwipeDirection(this._touchesInfo[0]);
            for (var i = 1; i < this.getCurrentTouchIdCount(); i += 1) {
                if (swipe_dir !== this.__getSwipeDirection(this._touchesInfo[i])) {
                    this.failed();
                    return;
                }
            }
            _super.prototype.touchesEnded.call(this, e);
            if (this._callback) {
                this._callback(this._fingers, swipe_dir);
            }
        }
    };
    GR_Swipe.prototype.__getSwipeDirection = function (touchInfo) {
        var yy = touchInfo.endY - touchInfo.y;
        var angle = Math.abs(Math.atan2(yy, touchInfo.endX - touchInfo.x));
        if (angle >= 0 && angle < SWIPE_RECOGNIZER_ANGLE_THRESHOLD) {
            return SwipeDirection.RIGHT;
        }
        else if (angle < Math.PI && angle > Math.PI - SWIPE_RECOGNIZER_ANGLE_THRESHOLD) {
            return SwipeDirection.LEFT;
        }
        else if (angle >= Math.PI / 2 - SWIPE_RECOGNIZER_ANGLE_THRESHOLD && angle < Math.PI / 2 + SWIPE_RECOGNIZER_ANGLE_THRESHOLD) {
            return yy < 0 ? SwipeDirection.UP : SwipeDirection.DOWN;
        }
        return SwipeDirection.CANT_TELL;
    };
    return GR_Swipe;
})(GestureRecognizer);
var GR_Pinch5 = (function (_super) {
    __extends(GR_Pinch5, _super);
    function GR_Pinch5(callback) {
        _super.call(this, callback);
        this._contour = 0;
        this._started = false;
        this.setCaptureTouchIdLen(5);
        this.id = "Pinch5";
        return this;
    }
    GR_Pinch5.prototype.touchesBegan = function (e) {
        _super.prototype.touchesBegan.call(this, e);
        if (this.getStatus() === GestureStatus.ST_BEGAN) {
            this._contour = this.__getContourLength();
        }
    };
    GR_Pinch5.prototype.__getContourLength = function () {
        var contour = 0;
        var ti0 = this._touchesInfo[0];
        this._touchesInfo.forEach(function (ti1) {
            contour += Math.sqrt((ti1.endX - ti0.endX) * (ti1.endX - ti0.endX) + (ti1.endY - ti0.endY) * (ti1.endY - ti0.endY));
        });
        return contour;
    };
    GR_Pinch5.prototype.touchesMoved = function (e) {
        if (!this.acceptsInput()) {
            return;
        }
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var touch = e.changedTouches[i];
            var id = touch.identifier;
            var touchInfo = this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
            }
        }
        var contour = this.__getContourLength();
        var ratio = contour / this._contour;
        if (!this._started) {
            if (contour / this._contour < MIN_CONTOUR_RATIO_TO_PINCH5) {
                this._started = true;
                this.__notify(ratio);
            }
        }
        else {
            this.__notify(ratio);
        }
    };
    GR_Pinch5.prototype.__notify = function (ratio) {
        if (this._callback) {
            this._callback(ratio);
        }
    };
    GR_Pinch5.prototype.touchesEnded = function (e) {
        if (!this._started) {
            this.failed();
            return;
        }
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            this.clearTouchId(e.changedTouches[i].identifier);
        }
        if (this.allCapturedTouchIdsReleased()) {
            _super.prototype.touchesEnded.call(this, e);
            if (this._callback) {
                this._callback(0);
            }
        }
    };
    GR_Pinch5.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this._started = false;
    };
    return GR_Pinch5;
})(GestureRecognizer);
var GR_PinchZoom = (function (_super) {
    __extends(GR_PinchZoom, _super);
    function GR_PinchZoom(callback) {
        _super.call(this, callback);
        this.setCaptureTouchIdLen(2);
        this.id = "Pinch and Zoom";
        this._gestureRotation = 0;
        this._gestureScale = 0;
        this._scale = 1;
        this._rotation = 0;
        this._started = false;
        return this;
    }
    GR_PinchZoom.prototype.touchesBegan = function (e) {
        _super.prototype.touchesBegan.call(this, e);
        if (this.getStatus() === GestureStatus.ST_BEGAN) {
            var e0 = this._touchesInfo[0];
            var e1 = this._touchesInfo[1];
            this._scale = 1;
            this._rotation = 0;
            this._gestureScale = Math.sqrt((e1.y - e0.y) * (e1.y - e0.y) + (e1.x - e0.x) * (e1.x - e0.x));
            this._gestureRotation = Math.atan2(e1.y - e0.y, e1.x - e0.x);
        }
    };
    GR_PinchZoom.prototype.touchesMoved = function (e) {
        if (!this.acceptsInput()) {
            return;
        }
        if (this.getCurrentTouchIdCount() !== this._fingers) {
            this.failed();
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var touch = e.changedTouches[i];
            var id = touch.identifier;
            var touchInfo = this.getTouchInfoById(id);
            if (touchInfo) {
                touchInfo.setEndPosition(touch.pageX, touch.pageY);
            }
        }
        if (!this._started) {
            if (this.getGestureElapsedTime() > TIME_TO_START_PINCH_ZOOM) {
                this.failed();
                return;
            }
            for (var i = 0; i < this._touchesInfo.length; i++) {
                if (!this._touchesInfo[i].isValidDistance(DISTANCE_THRESHOLD_TO_BE_PINCHZOOM)) {
                }
            }
            this._started = true;
        }
        _super.prototype.touchesMoved.call(this, e);
        var e0 = this._touchesInfo[0];
        var e1 = this._touchesInfo[1];
        var gr = Math.atan2(e1.endY - e0.endY, e1.endX - e0.endX);
        this._rotation += gr - this._gestureRotation;
        this._gestureRotation = gr;
        var gs = Math.sqrt((e1.endY - e0.endY) * (e1.endY - e0.endY) + (e1.endX - e0.endX) * (e1.endX - e0.endX));
        var sc = this._scale + (gs / this._gestureScale) - 1;
        if (sc < 0.2) {
            this._scale = 0.2;
        }
        else {
            this._scale = sc;
            this._gestureScale = gs;
        }
        var tx = e0.endX - e0.x;
        var ty = e0.endY - e0.y;
        if (this._callback) {
            this._callback({
                scale: this._scale,
                rotation: this._rotation * 180 / Math.PI,
                x: tx,
                y: ty
            });
        }
    };
    GR_PinchZoom.prototype.touchesEnded = function (e) {
        if (!this.allCapturedTouchIdsReleased()) {
            this.failed();
        }
        else {
            _super.prototype.touchesEnded.call(this, e);
        }
    };
    GR_PinchZoom.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this._started = false;
    };
    return GR_PinchZoom;
})(GestureRecognizer);
var GestureManager = (function () {
    function GestureManager(target) {
        this._gestureRecognizerList = [];
        this._touchIds = [];
        this._target = null;
        this._touchStartFn = this.__touchStartHandler.bind(this);
        this._touchMoveFn = this.__touchMoveHandler.bind(this);
        this._touchEndFn = this.__touchEndHandler.bind(this);
        this._touchCancelFn = this.__touchCancelHandler.bind(this);
        if (target) {
            this.__setTarget(target);
        }
        return this;
    }
    GestureManager.prototype.__findIdPos = function (id) {
        for (var i = 0; i < this._touchIds.length; i++) {
            if (this._touchIds[i] === id) {
                return i;
            }
        }
        return -1;
    };
    GestureManager.prototype.__setTarget = function (target) {
        if (this._target) {
            this._target.removeEventListener("touchstart", this._touchStartFn);
            this._target.removeEventListener("touchmove", this._touchMoveFn);
            this._target.removeEventListener("touchend", this._touchEndFn);
            this._target.removeEventListener("touchcancel", this._touchCancelFn);
            this._target.removeEventListener("MozTouchDown", this._touchStartFn);
            this._target.removeEventListener("MozTouchMove", this._touchMoveFn);
            this._target.removeEventListener("MozTouchRelease", this._touchEndFn);
            this._target.removeEventListener("MozTouchCancel", this._touchCancelFn);
        }
        this._target = target;
        target.addEventListener("touchstart", this._touchStartFn, false);
        target.addEventListener("touchmove", this._touchMoveFn, false);
        target.addEventListener("touchend", this._touchEndFn, false);
        target.addEventListener("touchcancel", this._touchCancelFn, false);
        target.addEventListener("MozTouchDown", this._touchStartFn, false);
        target.addEventListener("MozTouchMove", this._touchMoveFn, false);
        target.addEventListener("MozTouchRelease", this._touchEndFn, false);
        target.addEventListener("MozTouchCancel", this._touchCancelFn, false);
    };
    GestureManager.prototype.__touchStartHandler = function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var id = e.changedTouches[i].identifier;
            if (this.__findIdPos(id) === -1) {
                this._touchIds.push(id);
            }
        }
        this._gestureRecognizerList.forEach(function (gr) {
            if (gr.acceptsInput()) {
                gr.touchesBegan(e);
            }
        });
    };
    GestureManager.prototype.__touchMoveHandler = function (e) {
        e.preventDefault();
        this._gestureRecognizerList.forEach(function (gr) {
            if (gr.acceptsInput()) {
                gr.touchesMoved(e);
            }
        });
    };
    GestureManager.prototype.__touchEndHandler = function (e) {
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var id = e.changedTouches[i].identifier;
            var pos = this.__findIdPos(id);
            if (pos !== -1) {
                this._touchIds.splice(pos, 1);
            }
        }
        e.preventDefault();
        this._gestureRecognizerList.forEach(function (gr) {
            if (gr.acceptsInput()) {
                gr.touchesEnded(e);
            }
        });
        this.__shouldReset();
    };
    GestureManager.prototype.__touchCancelHandler = function (e) {
        for (var i = 0; i < e.changedTouches.length; i += 1) {
            var id = e.changedTouches[i].identifier;
            var pos = this.__findIdPos(id);
            if (pos !== -1) {
                this._touchIds.splice(pos, 1);
            }
        }
        e.preventDefault();
        this._gestureRecognizerList.forEach(function (gr) {
            if (gr.acceptsInput()) {
                gr.touchesCanceled(e);
            }
        });
        this.__shouldReset();
    };
    GestureManager.prototype.__shouldReset = function () {
        if (this._touchIds.length === 0) {
            this.__resetGestureRecognizers();
        }
    };
    GestureManager.prototype.addGestureRecognizer = function (gr) {
        this._gestureRecognizerList.push(gr);
        return this;
    };
    GestureManager.prototype.__resetGestureRecognizers = function () {
        this._gestureRecognizerList.forEach(function (gr) {
            gr.reset();
        });
    };
    GestureManager.prototype.on = function (event, callback, touch_points) {
        switch (event) {
            case "tap":
                this.addGestureRecognizer(new GR_Tap(touch_points, callback));
                break;
            case "longtap":
                this.addGestureRecognizer(new GR_LongTap(touch_points, callback));
                break;
            case "doubletap":
                this.addGestureRecognizer(new GR_DoubleTap(touch_points, callback));
                break;
            case "swipe":
                this.addGestureRecognizer(new GR_Swipe(touch_points, callback));
                break;
            case "pinchzoom":
                this.addGestureRecognizer(new GR_PinchZoom(callback));
                break;
            case "pinch5":
                this.addGestureRecognizer(new GR_Pinch5(callback));
                break;
            default:
        }
    };
    return GestureManager;
})();
exports.GestureManager = GestureManager;
//# sourceMappingURL=GestureManager.js.map