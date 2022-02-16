
// goya.sidebar.layers

{
	init() {
		// fast references
		this.els = {
			easel: window.find(`.easel`),
			body: window.find(`.layers-body`),
			bgLayer: window.find(`.layers-body .layer:nth(1)`),
		};
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar.layers,
			name,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			case "set-canvas":
				if (event.bg) {
					Self.els.bgLayer.find(".thumbnail span")
						.css({ background: event.bg });
				}

				let max = 33,
					ratio = event.width / event.height,
					width = ratio > 1 ? max : Math.round(ratio * max),
					height = ratio > 1 ? Math.round(width / ratio) : max;

				Self.els.body.css({
					"--thumb-width": `${width}px`,
					"--thumb-height": `${height}px`,
				});
				break;
			case "toggle-layer-visiblity":
				el = event.el.parents(".layer[data-layer]");
				value = event.el.hasClass("icon-eye-off");
				event.el.toggleClass("icon-eye-off", value);

				Self.els.easel.find(`.fl-${el.data("layer")}`)
					.css({ display: value ? "" : "none" });
				break;
		}
	}
}
