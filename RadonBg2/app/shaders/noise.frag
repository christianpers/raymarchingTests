#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;

float plot(vec2 st, float pct){
  return  smoothstep( pct-0.01, pct, st.y) - 
          smoothstep( pct, pct+0.01, st.y);
}

vec3 colorA = vec3(0.149,0.141,0.912);
vec3 colorB = vec3(1.000,0.833,0.224);

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0, 
                     0.0, 
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size,
                        _size+vec2(0.001),
                        _st);
    uv *= smoothstep(_size,
                    _size+vec2(0.001),
                    vec2(1.0)-_st);
    return uv.x*uv.y;
}

float cross(in vec2 _st, float _size){
    return  box(_st, vec2(_size,_size/4.)) + 
            box(_st, vec2(_size/4.,_size));
}

float boxTest(in vec2 st, in float w, in float h, in float x, in float y, in vec2 mouse){

    vec2 invertedSt = 1.0 - st;

    vec2 topLeft = vec2((1.0 - x)-w, y);
    vec2 bottomLeft = vec2(x , (1.0 - y)-h);

    vec2 tr = smoothstep(topLeft, max(topLeft, vec2(mouse.x/2.0)), invertedSt);
    vec2 bl = smoothstep(bottomLeft, max(bottomLeft, vec2(mouse.x/2.0)), st);

    return bl.x * bl.y * tr.x * tr.y; 
}

void main() {
	vec2 st = gl_FragCoord.xy/u_res.xy;
    vec3 color = vec3(0.0);

    vec2 mouse = u_mouse.xy / u_res.xy;

    // u_time = u_time / 100.0; 
    // Each result will return 1.0 (white) or 0.0 (black).
  	// bottom-left

    // vec2 bl = smoothstep(vec2(0.1), max(vec2(.1),vec2(mouse.y/2.0)),st); 
    // float pct = bl.x * bl.y;

    // // top-right 
    // vec2 tr = smoothstep(vec2(0.1), max(vec2(.1),vec2(mouse.y/2.0)),1.0 - st);
    // pct *= tr.x * tr.y;

    vec2 translate = vec2(cos(u_time/100.0),sin(u_time/100.0));
    st += translate*0.15;

    // Show the coordinates of the space on the background
    // color = vec3(st.x,st.y,0.0);

    // Add the shape on the foreground
    color += vec3(cross(st,0.25));

    // float pct = boxTest(st, .1, .1, .5, .5, mouse);
    // pct += boxTest(st, .1, .1, .0, .0, mouse);
    // pct += boxTest(st, .1, .1, .3, .8, mouse);
    // pct += boxTest(st, .1, .1, .8, .1, mouse);
    // pct += boxTest(st, .1, .1, .6, .8, mouse);
    
    // color = vec3(pct); 

    gl_FragColor = vec4(color,1.0);
}