
class File {

	constructor(fsFile, data) {
		// save reference to original FS file
		this._file = fsFile || new karaqu.File({ kind: "jpg" });

		// if new "empty" file
		if (!fsFile.blob) return;

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

						/*
						let style = `position: absolute; top: 0; left: 0; width: 300px; height: 250px; overflow: hidden;`,
							str = `<div style="${style}"><canvas width="${width}" height="${height}"></canvas></div>`,
							div = goya.els.easel.find(".file-layers").append(str),
							ctx2 = div.find("canvas")[0].getContext("2d");
						ctx2.translate(0, height);
						ctx2.scale(1, -1);
						ctx2.drawImage(cvs[0], 0, 0);
						*/


						// TODO: create texture correctly
						// need to make gamma correction
						// this.adjustGamma(cvs[0], 1.5);

						let wgl = STUDIO.wgl,
							Paint = STUDIO.painter,
							texture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, width, height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
						wgl.texImage2D(wgl.TEXTURE_2D, texture, 0, wgl.RGBA, wgl.RGBA, wgl.UNSIGNED_BYTE, cvs[0]);

						// resize layers
						window.find(".file-layers").css(dim);

						// Paint.resize({ ...dim, simulatorResize: true });
						Paint.resize(dim);
						Paint.simulator.resize(width, height);
						Paint.simulator.applyPaintTexture(texture, dim);
						Paint.needsRedraw = true;
						Paint.startUpdate();

						goya.sidebar.layers.dispatch({ type: "update-thumbnail" });
					});
				break;
			case "goya": /* TODO */ break;
		}
	}

	adjustGamma(cvs, gamma) {
	    let gammaCorrection = 1 / gamma;
	    let ctx = cvs.getContext('2d');
	    let imageData = ctx.getImageData(0.0, 0.0, cvs.width, cvs.height);
	    let data = imageData.data;
	    for (var i = 0; i < data.length; i += 4) {
	        data[i] = 255 * Math.pow((data[i] / 255), gammaCorrection);
	        data[i+1] = 255 * Math.pow((data[i+1] / 255), gammaCorrection);
	        data[i+2] = 255 * Math.pow((data[i+2] / 255), gammaCorrection);
	    }
	    ctx.putImageData(imageData, 0, 0);
	}

	loadImage(url) {
		return new Promise(resolve => {
			let img = new Image;
			img.src = url;
			img.onload = () => resolve(img);
		});
	}

	dispatch(event) {
		let APP = goya,
			name,
			str;
		switch (event.type) {
			case "close-file":
				STUDIO.painter.clear();
				STUDIO.painter.stopUpdate();
				break;
		}
	}

	async toBlob(mime, quality) {
		let bgColor = goya.sidebar.layers.dispatch({ type: "get-bg-color" });
		// return promise generating blob
		return new Promise(async (resolve, reject) =>
			STUDIO.painter.toBlob(blob => resolve(blob), mime, quality, bgColor));
	}

	get isDirty() {
		
	}

}
