
class File {

	constructor(fsFile, data) {
		// save reference to original FS file
		this._file = fsFile || new defiant.File();

		// temp offscreen canvas
		let { cvs, ctx } = Utilities.createCanvas(1, 1);

		switch (this._file.kind) {
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
				let src = URL.createObjectURL(fsFile.blob);
				this.loadImage(src)
					.then(img => {
						let width = img.width,
							height = img.height,
							dim = { width, height };

						cvs.attr(dim);
						// flip image vertically
						ctx.translate(0, height);
						ctx.scale(1, -1);
						ctx.drawImage(img, 0, 0);

						let wgl = STUDIO.wgl,
							Paint = STUDIO.painter,
							texture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, 0, 0, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);

						wgl.texImage2D(wgl.TEXTURE_2D, texture, 0, wgl.RGBA, wgl.RGBA, wgl.UNSIGNED_BYTE, cvs[0]);

						// TODO
						window.find(".file-layers").css(dim);

						// Paint.resize({ ...dim, simulatorResize: true });
						Paint.resize(dim);
						Paint.simulator.resize(width, height);
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
		// return promise
		return new Promise(async (resolve, reject) => {
			// generate blob
			STUDIO.painter.toBlob(blob => {
				// return created blob
				resolve(blob);
			}, mime, quality);
		});

		// return new Blob([data], { type });
	}

	get isDirty() {
		
	}

}
