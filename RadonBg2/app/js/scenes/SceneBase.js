export default class SceneBase{

	constructor(fragShader, fbo){

		this.scene = new THREE.Scene();

		this.lastMousePos = new THREE.Vector2(0.0,0.0);

		this.timestamp = Date.now();

		this.clock = new THREE.Clock();

		const texture = THREE.ImageUtils.loadTexture( 'assets/gridTexture.jpg', null );
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearMipMapLinearFilter;
		texture.wrapS = THREE.MirroredRepeatWrapping;
		texture.wrapT = THREE.MirroredRepeatWrapping;

		const resUniforms = {};
		resUniforms.u_res = {value: new THREE.Vector2(window.innerWidth, window.innerHeight)};

		const interactiveUniforms = {};
		interactiveUniforms.u_mouse = {value: this.lastMousePos};
		interactiveUniforms.u_time = {value: .1};
		if (fbo)
			interactiveUniforms.texture = {value: fbo.texture};

		interactiveUniforms.gridTexture = {value: texture};

		const uniformsObj = Object.assign({}, interactiveUniforms, resUniforms);

		var material = new THREE.ShaderMaterial({
			uniforms: uniformsObj,
			vertexShader: require("../../shaders/noise.vert"),
			fragmentShader: fragShader
		});

		var plane = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);

		this.quad = new THREE.Mesh( plane, material );
		this.quad.position.z = 0;
		this.scene.add( this.quad );

		window.addEventListener('mousemove', this.onMouseMove.bind(this));
	}

	onMouseMove(e){

		this.lastMousePos.x = e.clientX;
		this.lastMousePos.y = e.clientY;

		
	}
	

	update(){

		this.quad.material.uniforms.u_mouse.value = this.lastMousePos;
		this.quad.material.uniforms.u_time.value += this.clock.getDelta();

	}
}