
// goya.sidebar.layers

{
	init() {
		// fast references
		this.els = {
			easel: window.find(`.easel`),
			body: window.find(`.layers-body`),
			bgLayer: window.find(`.layers-body .layer:nth(1)`),
			drawCvs: window.find(`.layers-body .layer:nth(0) canvas`),
		};
		// reference to draw canvas context
		this.els.drawCtx = this.els.drawCvs[0].getContext("2d");
		// thumb dimension values
		this.vars = { max: 33 };
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar.layers,
			name,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			case "update-thumbnail":
				STUDIO.painter.toBlob(blob => {
					let opt = {
							resizeWidth: Self.vars.width,
							resizeHeight: Self.vars.height,
							resizeQuality: "medium",
						};
					createImageBitmap(blob, opt)
						.then(img => {
							Self.els.drawCvs.prop({
								width: Self.vars.width,
								height: Self.vars.height,
							});
							Self.els.drawCtx.drawImage(img, 0, 0);
						});
				});
				break;
			case "set-canvas":
				if (event.bgColor) {
					Self.els.bgLayer.find(".thumbnail span").css({ background: event.bgColor });
					// set easel canvas bg color
					Self.els.easel.find(".fl-1").css({ background: event.bgColor });
					// save bg-color value
					Self.vars.bgColor = event.bgColor;
					// update painter clear color
					let hsl = Color.hexToHsl( event.bgColor );
					STUDIO.painter.clearColor = [...hsvToRyb(...hsl), 0];
				}

				value = Self.els.easel.find(".fl-1").css("background-color");
				value = Color.rgbToHex(value);
				if (value.slice(-2) === "00") {
					// Self.vars.bgColor = value = "#f1f1f1";
					// Self.els.easel.find(".fl-1").css({ "background-color": value });
				}

				Self.vars.ratio = event.width / event.height,
				Self.vars.width = Self.vars.ratio > 1 ? Self.vars.max : Math.round(Self.vars.ratio * Self.vars.max),
				Self.vars.height = Self.vars.ratio > 1 ? Math.round(Self.vars.width / Self.vars.ratio) : Self.vars.max;

				Self.els.drawCvs.prop({
					width: Self.vars.width,
					height: Self.vars.height,
				});
				Self.els.body.css({
					"--thumb-width": `${Self.vars.width}px`,
					"--thumb-height": `${Self.vars.height}px`,
				});
				break;
			case "toggle-layer-visiblity":
				el = event.el.parents(".layer[data-layer]");
				value = event.el.hasClass("icon-eye-off");
				event.el.toggleClass("icon-eye-off", value);

				Self.els.easel.find(`.fl-${el.data("layer")}`)
					.css({ display: value ? "" : "none" });
				break;
			case "get-bg-color":
				if (!Self.els.bgLayer.find(".icon-eye-on").hasClass("icon-eye-off")) {
					value = Self.vars.bgColor || Self.els.bgLayer.css("background-color");
				}
				return value;
		}
	}
}
