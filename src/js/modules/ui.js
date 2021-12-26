
const UI = {
	init() {
		// fast references
		this.doc = $(document);
		this.content = window.find("content");

		this.content.find(".knob[data-change]").map(item => {
			let el = $(item),
				min = +el.data("min"),
				max = +el.data("max"),
				val = +el.data("value"),
				value = Math.round((val / max) * 100);

			el.data({ value })
			el.nextAll(".value").html(val);
		});

		// bind event handlers
		this.content.on("mousedown", ".knob, .pan-knob", this.doKnob);
	},
	doKnob(event) {
		let APP = goya,
			Self = UI,
			Drag = Self.drag,
			name,
			value,
			type,
			el;
		switch (event.type) {
			case "mousedown":
				// prevent default behaviour
				event.preventDefault();

				el = $(event.target);
				value = +el.data("value");

				Self.drag = {
					el,
					value,
					type: el.data("change"),
					arg: el.data("arg"),
					clientY: event.clientY,
					clientX: event.clientX,
					min: el.hasClass("pan-knob") ? -50 : 0,
					max: el.hasClass("pan-knob") ? 50 : 100,
					val: {
						el: el.parent().find(".value"),
						min: el.hasClass("pan-knob") ? 0 : +el.data("min"),
						max: +el.data("max") - +el.data("min"),
						step: +el.data("step") || 1,
					}
				};

				// bind event handlers
				Self.content.addClass("no-cursor");
				Self.doc.on("mousemove mouseup", Self.doKnob);
				break;
			case "mousemove":
				value = Math.round((Drag.clientY - event.clientY) + Drag.value);
				value = Math.min(Math.max(value, Drag.min), Drag.max);
				Drag.el.data({ value });

				let i = Drag.val.step.toString().split(".")[1],
					val = (Drag.val.max * (value / 100)) + Drag.val.min;

				Drag.val.el.html(val.toFixed(i ? i.length : 0));
				break;
			case "mouseup":
				// unbind event handlers
				Self.content.removeClass("no-cursor");
				Self.doc.off("mousemove mouseup", Self.doKnob);

				// emit change event
				type = Drag.type;
				value = +Drag.val.el.text();
				if (type) {
					APP.sidebar.dispatch({ type, arg: Drag.arg, value });
				}
				break;
		}
	}
};

UI.init();
