import SceneBase from './scenes/SceneBase';


export default class SceneMain {
	constructor(container) {

		this.FBOPost = new THREE.WebGLRenderTarget(
							window.innerWidth,
							window.innerHeight,
							{
								minFilter: THREE.LinearFilter,
								magFilter: THREE.NearestFilter,
								format: THREE.RGBFormat
							}
						);

		this.FBO = new THREE.WebGLRenderTarget(
							window.innerWidth,
							window.innerHeight,
							{
								minFilter: THREE.LinearFilter,
								magFilter: THREE.NearestFilter,
								format: THREE.RGBFormat
							}
						);

		this.sceneBase = new SceneBase(require("../shaders/rayMarching.frag"));
		this.scenePost = new SceneBase(require("../shaders/vhs.frag"), this.FBO);
		this.sceneMultiple = new SceneBase(require("../shaders/multiple.frag"), this.FBOPost)

		
		this.start_time = Date.now();

		this.windowHalfX;
		this.windowHalfY;

		this.container = container;


		this.doRender = true;

		this.container.style.opacity = 1;

		
		this.camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 3000 );
		// this.camera.position.z = 1;
		// this.camera.position.y = 0;

		this.orthoCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);

		this.renderer = new THREE.WebGLRenderer( { antialias: false, alpha: false } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.autoClear = false;
		// this.renderer.setClearColorHex( 0x000000, 1 );
		// this.renderer.setClearColor( '#e206db' );
		this.renderer.setClearColor('#000000');
		this.container.appendChild( this.renderer.domElement );

		this.currentTime = Date.now();

	}

	loop(){

		this.update();
		this.render();
	}

	update() {

		this.sceneBase.update();
		this.scenePost.update();
	}

	render() {

		if (!this.doRender) return;

		this.renderer.clear();
	
		this.renderer.render( this.sceneBase.scene, this.orthoCamera, this.FBO, true );
		this.renderer.render( this.scenePost.scene, this.orthoCamera, this.FBOPost, true );
		this.renderer.render( this.sceneMultiple.scene, this.orthoCamera );

	}

	onResize(w,h) {

		this.windowHalfX = w/2;
		this.windowHalfY = h/2;

		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( w,h );


	}
}
