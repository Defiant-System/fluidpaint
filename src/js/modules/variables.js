
let QUALITIES = [
		{ name: "Low", resolutionScale: 1.0 },
		{ name: "Medium", resolutionScale: 1.5 },
		{ name: "High", resolutionScale: 2.0 }
	],
	InteractionMode = {
		NONE: 0,
		PAINTING: 1,
		RESIZING: 2,
		PANNING: 3
	},
	ResizingSide = {
		NONE: 0,
		LEFT: 1,
		RIGHT: 2,
		BOTTOM: 3,
		TOP: 4,
		TOP_LEFT: 5,
		TOP_RIGHT: 6,
		BOTTOM_LEFT: 7,
		BOTTOM_RIGHT: 8
	},
	ColorModel = {
		RYB: 0,
		RGB: 1
	},
	INITIAL_QUALITY = 1,
	INITIAL_WIDTH = 600,
	INITIAL_HEIGHT = 400,
	MIN_PAINTING_WIDTH = 300,
	MAX_PAINTING_WIDTH = 4096, //this is further constrained by the maximum texture size
	//brush parameters
	MAX_BRISTLE_COUNT = 100,
	MIN_BRISTLE_COUNT = 10,
	MIN_BRUSH_SCALE = 5,
	MAX_BRUSH_SCALE = 75,
	BRUSH_HEIGHT = 2.0, //how high the brush is over the canvas - this is scaled with the brushScale
	Z_THRESHOLD = 0.13333, //this is scaled with the brushScale
	//splatting parameters
	SPLAT_VELOCITY_SCALE = 0.14,
	SPLAT_RADIUS = 0.05,
	//for thin brush (fewest bristles)
	THIN_MIN_ALPHA = 0.002,
	THIN_MAX_ALPHA = 0.08,
	//for thick brush (most bristles)
	THICK_MIN_ALPHA = 0.002,
	THICK_MAX_ALPHA = 0.025,
	//panel is aligned with the top left
	PANEL_WIDTH = 300,
	PANEL_HEIGHT = 580,
	PANEL_BLUR_SAMPLES = 13,
	PANEL_BLUR_STRIDE = 8,
	// COLOR_PICKER_LEFT = 20,
	// COLOR_PICKER_TOP = 523,
	RESIZING_RADIUS = 20,
	RESIZING_FEATHER_SIZE = 8, //in pixels 
	//box shadow parameters
	BOX_SHADOW_SIGMA = 5.0,
	BOX_SHADOW_WIDTH = 10.0,
	PAINTING_SHADOW_ALPHA = 0.25,
	PANEL_SHADOW_ALPHA = 1.0,
	//rendering parameters
	BACKGROUND_GRAY = 0.7,
	NORMAL_SCALE = 7.0,
	ROUGHNESS = 0.075,
	F0 = 0.05,
	SPECULAR_SCALE = 0.65,
	DIFFUSE_SCALE = 0.15,
	LIGHT_DIRECTION = [0, 1, 1],
	HISTORY_SIZE = 4; //number of snapshots we store - this should be number of reversible actions + 1

// Brush variables
let N_PREVIOUS_SPEEDS = 15, // how many previous speeds we store
	SPLATS_PER_SEGMENT = 8,
	VERTICES_PER_BRISTLE = 10,
	BRISTLE_LENGTH = 4.5, // relative to a scale of 1
	BRISTLE_JITTER = 0.5,
	ITERATIONS = 20,
	GRAVITY = 30.0,
	BRUSH_DAMPING = 0.75,
	STIFFNESS_VARIATION = 0.3;

// Simulator variables
let PRESSURE_JACOBI_ITERATIONS = 2,
	FRAMES_TO_SIMULATE = 60, // how many frames to simulate the area induced by each splat for
	SPLAT_PADDING = 4.5, // approximately sqrt(BRISTLE_LENGTH * BRISTLE_LENGTH - BRUSH_HEIGHT * BRUSH_HEIGHT)
	SPEED_PADDING = 1.1;
