function Pointable(x, y, z, id) {

    this.setPosition = function (x, y) {
        this.x = x;
        this.y = y;
        this.nx = x;
        this.ny = y;
    };

    this.setNewPosition = function (x, y) {
        this.nx = x;
        this.ny = y;
    };

    this.updatePos = function () {
        this.x = this.nx;
        this.y = this.ny;
    };

    this.id = id;
    this.setPosition(x, y);

    return this;
}