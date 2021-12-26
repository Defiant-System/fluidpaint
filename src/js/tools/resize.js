
// goya.tools.resize

{
	init() {
		// references to elements
		this.els = {
			doc: $(document),
			content: window.find("content"),
			easel: window.find(".easel"),
		};
		// bind event handler
		this.els.easel.on("mousedown", ".resize", this.dispatch);
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.tools.resize,
			Drag = Self.drag,
			el;
		// console.log(event);
		switch (event.type) {
			// native events
			case "mousedown":
				// prevent default behaviour
				event.preventDefault();
				// cover layout
				Self.els.content.addClass("no-cursor");

				el = Self.els.easel.find("canvas");

				let direction = event.target.className.split(" ")[1],
					offset = {
						width: +el.prop("offsetWidth"),
						height: +el.prop("offsetHeight"),
					},
					click = {
						y: event.clientY,
						x: event.clientX,
					};

				// create drag object
				Self.drag = {
					el,
					direction,
					click,
					offset,
				};

				// bind event
				Self.els.doc.on("mousemove mouseup", Self.dispatch);
				break;
			case "mousemove":
				let data = {};
				switch (Drag.direction) {
					case "north": 
					case "south":
						data.height = Drag.offset.height + (event.clientY - Drag.click.y);
						break;
					case "east": 
					case "west":
						data.width = Drag.offset.width + (event.clientX - Drag.click.x);
						break;
				}
				Drag.el.prop(data);
				break;
			case "mouseup":
				// uncover layout
				Self.els.content.removeClass("no-cursor");
				// unbind event
				Self.els.doc.off("mousemove mouseup", Self.dispatch);
				break;
			// custom events
			case "focus-tool":
				Self.els.easel.addClass("resizing");
				// update interaction state
				STUDIO.painter.interactionState = InteractionMode.RESIZING;
				break;
			case "blur-tool":
				Self.els.easel.removeClass("resizing");
				break;
		}
	}
}