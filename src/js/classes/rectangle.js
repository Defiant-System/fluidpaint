
class Rectangle {
	constructor(left, bottom, width, height) {
		this._left = left;
		this._bottom = bottom;
		this._width = width;
		this._height = height;
	}

	get left() { return this._left; }
	set left(v) { this._left = v; }

	get bottom() { return this._bottom; }
	set bottom(v) { this._bottom = v; }

	get width() { return this._width; }
	set width(v) { this._width = v; }

	get height() { return this._height; }
	set height(v) { this._height = v; }

	get right() { return this._left + this._width; }
	set right(v) { this._width = v - this._left; }

	get top() { return this._bottom + this._height; }
	set top(v) { this._height = v - this._bottom; }

	clone() {
		return new Rectangle(this.left, this.bottom, this.width, this.height);
	}

	includeRectangle(rectangle) {
		var newRight = Math.max(this.right, rectangle.right),
			newTop = Math.max(this.top, rectangle.top);
		this._left = Math.min(this.left, rectangle.left);
		this._bottom = Math.min(this.bottom, rectangle.bottom);
		this.right = newRight;
		this.top = newTop;
		return this;
	}

	intersectRectangle(rectangle) {
		var newRight = Math.min(this.right, rectangle.right),
			newTop = Math.min(this.top, rectangle.top);
		this._left = Math.max(this.left, rectangle.left);
		this._bottom = Math.max(this.bottom, rectangle.bottom);
		this.right = newRight;
		this.top = newTop;
		return this;
	}

	translate(x, y) {
		this._left += x;
		this._bottom += y;
		return this;
	}

	scale(x, y) {
		this._left *= x;
		this._bottom *= y;
		this._width *= x;
		this._height *= y;
		return this;
	}

	round() {
		this._left = Math.round(this._left);
		this._bottom = Math.round(this._bottom);
		this._width = Math.round(this._width);
		this._height = Math.round(this._height);
	}

	getArea() {
		return this.width * this.height;
	}
}
