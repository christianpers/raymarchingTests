'use strict';
import './main.scss';
import SceneMain from "./js/SceneMain";

class Starter {
	constructor() {
		let canvas = document.createElement("canvas");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.className = "Main-Canvas";
		canvas.id = 'gl';
		var container = document.body.querySelector('.container')

		function transformProp() {
		  var testEl = document.createElement('div');
		  if(testEl.style.transform == null) {
		    var vendors = ['Webkit', 'Moz', 'ms'];
		    for(var vendor in vendors) {
		      if(testEl.style[ vendors[vendor] + 'Transform' ] !== undefined) {
		        return vendors[vendor] + 'Transform';
		      }
		    }
		  }
		  return 'transform';
		};

		window.NS = {};
		window.NS.GL = {};
		window.NS.GL.params = {};
		window.NS.GL.params.detail = 32;
		window.NS.transform = transformProp();
		window.NS.iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		
		
		this.sceneMain = new SceneMain(container);
		// this.main = new Main(new Data());

		this.onResize();
		window.addEventListener('resize', () => {
			this.onResize();
		});

		

		this.reqFrame();

	}

	reqFrame() {

		requestAnimationFrame(() => {
			this.reqFrame();
		});

		this.sceneMain.loop();
	}

	onResize() {
		var w = window.innerWidth;
		var h = window.innerHeight;
		this.sceneMain.onResize(w,h);
	}

};

if(document.body) new Starter();
else {
	window.addEventListener("load", new Starter());
}
