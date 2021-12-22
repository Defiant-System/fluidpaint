
class Snapshot {
	constructor(texture, paintingWidth, paintingHeight, resolutionScale) {
		this.texture = texture;
		this.paintingWidth = paintingWidth;
		this.paintingHeight = paintingHeight;
		this.resolutionScale = resolutionScale;
	}

	get textureWidth() {
		return Math.ceil(this.paintingWidth * this.resolutionScale);
	}

	get textureHeight() {
		return Math.ceil(this.paintingHeight * this.resolutionScale);
	}
}
