#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718
// #define MAX_MARCHING_STEPS 255
// #define MIN_DIST 0.0
// #define MAX_DIST 100.0
// #define EPSILON 0.0001

// const int MAX_MARCHING_STEPS = 50;
// const float MIN_DIST = 0.0;
// const float MAX_DIST = 4000.0;
const float EPSILON = 0.0001;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D texture;
uniform sampler2D gridTexture;

// 2D Random
float random (in vec2 st) { 
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners porcentages
    return mix(a, b, u.x) + 
            (c - a)* u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}



/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 * 
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
// float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
//     float depth = start;
//     for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
//         float dist = sceneSDF(eye + depth * marchingDirection);
//         if (dist < EPSILON) {
//             return depth;
//         }
//         // depth += dist;
//         depth += dist;
//         if (depth >= end) {
//             return end;
//         }
//     }
//     return end;
// }

const float MAX_DIST = 36.0;
const float MIN_DIST = 0.001;
const float DELTA_T = 0.03;
const int IT = 200;
const float NORMAL_OFFSET = 0.1;
const float FREQ = 0.00725;
const float HIGH_MODIF = .5;

mat4 rotateY(in float a)
{
   float cosa = cos(a);
   float sena = sin(a);
   return mat4( cosa, 0.0, -sena, 0.0,
               0.0  , 1.0, 0.0, 0.0,
               sena , 0.0, cosa , 0.0   ,
               0.0  , 0.0, 0.0 , 1.0    );
}

mat4 rotateX(in float a)
{
   float cosa = cos(a);
   float sena = sin(a);
   return mat4( 1.0, 0.0, 0.0, 0.0,
             0.0,   cosa , sena, 0.0,
             0.0, -sena , cosa , 0.0,
             0.0  , 0.0, 0.0 , 1.0  );
}

mat4 rotateZ(in float a)
{
   float cosa = cos(a);
   float sena = sin(a);
   return mat4( cosa ,sena , 0.0,  0.0,
                -sena, cosa, 0.0,   0.0,
                0.0  ,0.0  , 1.0,  0.0,
                0.0  ,0.0  , 0.0,  1.0  );
}



vec3 camera(in vec3 dir)
{
    vec3 cam =  dir;
   
    vec2 m = u_mouse.xy;
    m /= u_res.xy;
    m.x = .5;
    m.y = .2;
    float cosa = cos(m.x * 2.0 - 1.0);
    float sena = sin(m.x * 2.0 - 1.0);
    float cosb = cos(m.y * 2.0 - 1.0);
    float senb = sin(m.y * 2.0 - 1.0);
    mat4 rotY = rotateY(-(m.x * 2.0 - 1.0));
    mat4 rotX = rotateX(m.y * 2.0 - 1.0);

    cam = normalize(vec3(rotY *rotX *  vec4(cam, 0.0))); 
    
   return cam;
}

float fbm(vec2 p)
{
    float f = 0.0;   
    f += 0.5    * noise(p); p *= 2.07;
    // f += 0.250  * noise(p); p *= 2.03;
    // f += 0.125  * noise(p); p *= 2.05;
    // f += 0.0625 * noise(p); p *= 2.08;
    f /= 0.9375;
    return f;
}


float f(in vec2 v) {
    // return sin(v.x) + cos(u_time);
    // return -0000.1;
 
    return noise(v / 2.0);
    
    // return (2.0 * fbm(v * FREQ) - 1.0) * HIGH_MODIF;
}


vec3 getNormal( in vec3 p )
{
    vec3 n = vec3( f(vec2(p.x-NORMAL_OFFSET,p.z)) - f(vec2(p.x+NORMAL_OFFSET,p.z)),
                         2.0 * NORMAL_OFFSET,
                         f(vec2(p.x,p.z-NORMAL_OFFSET)) - f(vec2(p.x,p.z+NORMAL_OFFSET)) );
    return normalize( n );
}


bool castRay( in vec3 ro, in vec3 rd, out float T , out vec3 N)
{
    const float delt = DELTA_T;
    const float mint = MIN_DIST;
    const float maxt = MAX_DIST;
    
    bool res = false;
    vec3 p;
    for(int i = 0; i < IT; ++i)
   // for( float t = mint; t < maxt; t += delt )
    {
        //precission seems less important as we move far away
        //float dt = smoothstep(DELTA_T, 0.8, (float(i * i) / float(IT * IT)));
        
        float t =  DELTA_T * float(i) + MIN_DIST;
        p = ro + rd*t;
        if( p.y < (f(p.xz)))
        {
            T = t - 0.5 * delt;
            
            res = true;
            break;
        }
    }
    if(res) N = getNormal(p);
    return res;
}



void main() {
    vec2 st = gl_FragCoord.xy/u_res.xy;
    
    vec2 mouse = u_mouse.xy / u_res.xy;

    vec3 finalColor = vec3(0.0);

    // float mx=mouse.x*PI*2.0;
    // float my=mouse.y*PI/2.01;
    // vec3 prp=vec3( cos(my)*cos(mx), sin(my), cos(my)*sin(mx))*6.0 );

    // vec3 viewDir = rayDirection(45.0, u_res.xy, gl_FragCoord.xy);
    // // vec3 eye = vec3( cos(my)*cos(mx), sin(my), cos(my)*sin(mx) ) * 8.0;
    // vec3 eye = vec3(0.0, 0.0, -8.0);
    // mat4 viewToWorld = viewMatrixFunc(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    // vec3 worldDir = (viewToWorld * vec4(viewDir, 0.0)).xyz;
    // float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);

    vec2 ss = st * 2.0 - vec2(1.0);//from 1.0 to -1.0
    ss.y*= u_res.y / u_res.x;//aspect ratio
    
    vec3 origin = vec3(0.0, 1.2, -u_time * 1.5);
    // vec3 origin = vec3(0.0, sin(u_time * 1.1) * 1.0 + 2.0 ,-u_time * 2.0);
    vec3 dir = normalize(vec3(ss.x, ss.y, -1.0));
    dir = camera(dir);
    vec3 d = dir;
    vec3 o = origin;
    vec3 n;
    
    float t;
    if(castRay(o, d, t, n))
    {
        //moar phong
        //lets phong shading model
        vec3 ip = o + d * t;
        // vec3 lv = l.dir;

        // float d = max(0.3, dot(lv, n));
        
        // float h = ((ip.y/ HIGH_MODIF) );
        vec3 textureColor = texture2D(gridTexture, ip.xz).rgb;

        vec3 depthColor = (t * -1.0 + 4.0) * vec3(.5);

        finalColor = depthColor * vec3(.9, .5, .6);

        finalColor *= textureColor;


        
        // vec4 mColor = mix(texture(iChannel1, 2.0 * ip.xy / HIGH_MODIF + vec2(1.0)) 
        //                   * mix(vec4(1.0), vec4(0.1,0.954, 0.3, 1.0), 
        //               smoothstep(0.0, 1.0, h * 0.125)), vec4(1.0, 0.89, 0.97, 1.0), smoothstep(0.0, 1.0, h));
        // color   = mix(fogColor, vec4(mColor), smoothstep(1.0, 0.0, (t ) / (DELTA_T * float(IT) + MIN_DIST)));
        
        // //color = vec4(n,1.0);//l.diffuse * d  ;  
        // #ifdef PHONG_SHADING
        // color = l.diffuse * d * color;
        // #endif
        // t = t / (MAX_DIST);
        // float tInv = 1.0/t;
        // //height fog color
        // color = mix(color, vec4(0.0, 0.1, 0.4, 1.0), smoothstep(0.3, -0.6, h * tInv));
        //color = vec4(t / 50.0, t  / 50.0 , t  / 50.0, 1.0);
        // float yVal = ((ip.y + 1.0) / 2.0) * .6;
        // finalColor = t * vec3(.3, yVal, ip.z ) * vec3(1.0, .1, .9);
    }
    
    // if (dist > MAX_DIST - EPSILON) {
    //     // Didn't hit anything
    //     gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    //     return;
    // }

    // The closest point on the surface to the eyepoint along the view ray
    // vec3 p = eye + dist * worldDir;

    
    // // vec3 K_a = (estimateNormal(p) + vec3(1.0)) / 2.0;
    // vec3 K_a = vec3(.8, .8, .8);
    // vec3 K_d = vec3(0.7, 0.8, 0.2);
    // vec3 K_s = vec3(1.0, 1.0, 1.0);
    // float shininess = 10.0;
    
    // vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);
    // // vec3 color = vec3((b*c+pow(b,16.0))*(1.0-f*.01));

    // // vec3 finalColor = hsb2rgb(vec3(dist, .5, .8)) * color;
    // // vec3 finalColor = mix(vec3(.9, .2, .2), color, dist);
    // // vec3 edgeColor = vec3(.9, .2, .2) * (p * vec3(3.3)) ;
    // vec3 finalColor = mix(color, vec3(.9,.3,.3), p);
    
    gl_FragColor = vec4(finalColor, 1.0);
}

