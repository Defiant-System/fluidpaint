
class File {

	constructor(fsFile, data) {
		// save reference to original FS file
		this._file = fsFile || new defiant.File();

		// temp offscreen canvas
		let { cvs, ctx } = Utilities.createCanvas(1, 1);
		this.cvs = cvs;
		this.ctx = ctx;

		switch (this._file.kind) {
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
				let src = URL.createObjectURL(fsFile.blob);
				this.loadImage(src)
					.then(img => {
						this.cvs.width = img.width;
						this.cvs.height = img.height;
						this.ctx.drawImage(img, 0, 0);

						let wgl = STUDIO.wgl,
							Paint = STUDIO.painter,
							texture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, 0, 0, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST),
							dim = {
								bottom: 10,
								left: 10,
								width: img.width,
								height: img.height,
							};

						wgl.texImage2D(wgl.TEXTURE_2D, texture, 0, wgl.RGBA, wgl.RGBA, wgl.UNSIGNED_BYTE, img);

						Paint.simulator.applyPaintTexture(texture, dim);
						Paint.needsRedraw = true;
						Paint.update();
					});
				break;
			case "goya": /* TODO */ break;
		}
	}

	loadImage(url) {
		return new Promise(resolve => {
			let img = new Image;
			img.src = url;
			img.onload = () => resolve(img);
		});
	}

	dispatch(event) {
		let APP = eniac,
			xSheet,
			xClone,
			name,
			str;
		switch (event.type) {
			case "render-sheet-names":
				break;
		}
	}

	async toBlob(mime, quality) {
		let data,
			buffer,
			view;

		switch (kind) {
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
				data = this.ctx.getImageData(0, 0, this.width, this.height);
				break;
		}

		// return promise
		// return new Promise(async (resolve, reject) => {
		// 	// generate blob
		// 	this.cvs[0].toBlob((blob) => {
		// 		// restore file image
		// 		this.ctx.putImageData(backup, 0, 0);
		// 		// return created blob
		// 		resolve(blob);
		// 	}, mime, quality);
		// });

		return new Blob([data], { type });
	}

	get isDirty() {
		
	}

}
