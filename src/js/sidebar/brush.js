
// goya.sidebar.brush

{
	init() {
		// fast references
		this.els = {
			el: window.find(`.sidebar [data-section="brush"]`),
		};
	},
	presets: {
		"1": {
			"painter.brush.bristleCount": 30,
			"painter.brushScale": 20,
			"painter.brushHeight": 2,
			"painter.brush.stiffnessVariation": 0.3,
			"painter.brush.brushDamping": 0.15,
			"painter.brush.gravity": 30,
			"painter.simulator.fluidity": 0.8,
			"painter.splatVelocityScale": 0.14,
			"painter.splatRadius": 0.05
		},
		"2": {
			"painter.brush.bristleCount": 20,
			"painter.brushScale": 10,
			"painter.brushHeight": 2,
			"painter.brush.stiffnessVariation": 0.3,
			"painter.brush.brushDamping": 0.15,
			"painter.brush.gravity": 30,
			"painter.simulator.fluidity": 0.6,
			"painter.splatVelocityScale": 0.14,
			"painter.splatRadius": 0.05
		},
		"3": {
			"painter.brush.bristleCount": 10,
			"painter.brushScale": 20,
			"painter.brushHeight": 2,
			"painter.brush.stiffnessVariation": 0.3,
			"painter.brush.brushDamping": 0.15,
			"painter.brush.gravity": 30,
			"painter.simulator.fluidity": 0.8,
			"painter.splatVelocityScale": 0.14,
			"painter.splatRadius": 0.05
		}
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar.brush,
			data,
			name,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			case "select-brush-preset":
				el = $(event.target);
				if (el.data("arg")) {
					event.el.find(".active").removeClass("active");
					el.addClass("active");

					data = Self.presets[el.data("arg")];
					for (name in data) {
						let item = Self.els.el.find(`[data-arg="${name}"]`);
						item.data({ value: data[name] }).trigger("change");
					}
				}
				break;
		}
	}
}
