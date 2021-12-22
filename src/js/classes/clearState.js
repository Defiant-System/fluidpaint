
class ClearState extends State {
	constructor(wgl) {
		super(wgl, wgl);
	}

	bindFramebuffer(framebuffer) {
		this.setParameter("framebuffer", [framebuffer]);
		return this;
	}

	clearColor(r, g, b, a) {
		console.log( [r, g, b, a] );
		this.setParameter("clearColor", [r, g, b, a]);
		return this;
	}

	clearDepth(depth) {
		this.setParameter("clearDepth", [depth]);
		return this;
	}
	colorMask(r, g, b, a) {
		this.setParameter("colorMask", [r, g, b, a]);
		return this;
	}

	depthMask(enabled) {
		this.setParameter("depthMask", [enabled]);
		return this;
	}

	enable(cap) {
		if (cap === this.wgl.SCISSOR_TEST) {
			this.setParameter("scissorTest", [true]);
		}
		return this;
	}
	
	disable(cap) {
		if (cap === this.wgl.SCISSOR_TEST) {
			this.setParameter("scissorTest", [false]);
		}
		return this;
	}

	scissor(x, y, width, height) {
		this.setParameter("scissor", [x, y, width, height]);
		return this;
	}

}
