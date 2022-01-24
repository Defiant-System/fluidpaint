
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
			Painter = STUDIO.painter,
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
					},
					min = {
						width: 400,
						height: 300,
					};

				// create drag object
				Self.drag = {
					el,
					min,
					click,
					offset,
					direction,
				};

				// clone painting rectangle
				Painter.newPaintingRectangle = Painter.paintingRectangle.clone();

				// bind event
				Self.els.doc.on("mousemove mouseup", Self.dispatch);
				break;
			case "mousemove":
				let data = {};
				switch (Drag.direction) {
					case "north":
						data.height = Math.max(Drag.offset.height + (Drag.click.y - event.clientY), Drag.min.height);
						Painter.newPaintingRectangle.height = data.height;
						break;
					case "south":
						data.height = Math.max(Drag.offset.height + (event.clientY - Drag.click.y), Drag.min.height);
						Painter.newPaintingRectangle.height = data.height;
						break;
					case "east":
						data.width = Math.max(Drag.offset.width + (Drag.click.x - event.clientX), Drag.min.width);
						Painter.newPaintingRectangle.width = data.width;
						break;
					case "west":
						data.width = Math.max(Drag.offset.width + (event.clientX - Drag.click.x), Drag.min.width);
						Painter.newPaintingRectangle.width = data.width;
						break;
				}
				// origo from middle / center
				Painter.paintingRectangle.left = Math.round((data.width - Drag.offset.width) >> 1);
				Painter.paintingRectangle.bottom = Math.round((data.height - Drag.offset.height) >> 1);
				// resize canvas element
				Drag.el.prop(data);
				// resize easel element
				APP.els.easel.find(".file-layers").css(data);
				// resize painter
				Painter.resize({ ...Drag.offset, ...data });
				break;
			case "mouseup":
				Painter.simulator.resize(Painter.paintingResolutionWidth, Painter.paintingResolutionHeight, Painter.paintingRectangle.left, Painter.paintingRectangle.bottom);
				Painter.paintingRectangle = Painter.newPaintingRectangle;
				Painter.newPaintingRectangle = {};
				Painter.needsRedraw = true;
				// uncover layout
				Self.els.content.removeClass("no-cursor");
				// unbind event
				Self.els.doc.off("mousemove mouseup", Self.dispatch);
				break;
			// custom events
			case "focus-tool":
				Self.els.easel.addClass("resizing");
				// update interaction state
				Painter.interactionState = InteractionMode.RESIZING;
				break;
			case "blur-tool":
				Self.els.easel.removeClass("resizing");
				break;
		}
	}
}