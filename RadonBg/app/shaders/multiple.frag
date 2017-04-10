#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718
// #define MAX_MARCHING_STEPS 255
// #define MIN_DIST 0.0
// #define MAX_DIST 100.0
// #define EPSILON 0.0001

const int MAX_MARCHING_STEPS = 50;
const float MIN_DIST = 0.0;
const float MAX_DIST = 20.0;
const float EPSILON = 0.0001;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D texture;

// float plot(vec2 st, float pct){
//   return  smoothstep( pct-0.01, pct, st.y) - 
//           smoothstep( pct, pct+0.01, st.y);
// }

// vec3 colorA = vec3(0.149,0.141,0.912);
// vec3 colorB = vec3(1.000,0.833,0.224);

/**
 * Rotation matrix around the X axis.
 */
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

mat4 translate(vec3 d){
    return mat4(1.0, 0.0, 0.0, 0.0,  0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0,  d.x, d.y, d.z, 1.0);
}


// mat3 rotationMatrix(vec3 axis, float angle)
// {
//     axis = normalize(axis);
//     float s = sin(angle);
//     float c = cos(angle);
//     float oc = 1.0 - c;
    
//     return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
//                 oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
//                 oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
// }


/**
 * Rotation matrix around the Y axis.
 */
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0, 
                     0.0, 
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

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

// float opRep( vec3 p, vec3 c )
// {
//     vec3 q = mod(p,c)-0.5*c;
//     return primitve( q );
// }

float sdHexPrism( vec3 p, vec2 h ) {
    vec3 q = abs(p);
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}


/**
 * Signed distance function for a sphere centered at the origin with radius 1.0;
 */
float sdSphere(vec3 samplePoint, float radius) {
    return length(samplePoint) - radius;
}

float sdPlane( vec3 p )
{
    return p.y;
}

float obj_floor(in vec3 p)
{
  return p.y+10.0;
}

float obj_union(in float obj0, in float obj1)
{
  if (obj0 < obj1)
    return obj0;
  else
    return obj1;
}

float op_sub(float a, float b)
{
  float d = max(a, -b);
  return d;
}

float op_blend(vec3 p, float a, float b)
{
 float s = smoothstep(length(p), 0.0, 1.0);
 float d = mix(a, b, s);
 return d;
}

float displacement(vec3 p) {
    float displace = sin(u_time) * 2.0;
    return sin(displace*p.x)*sin(displace*p.y)*sin(displace*p.z);
}

vec4 opTx( vec4 p, mat4 m )
{
    vec4 q = m*p;
    return q;
}

vec4 getTransformedPoint(vec3 samplePoint, vec3 originTransformPoint, mat4 rotationMatrixIn, vec3 offset) {

    vec3 offsetPoint = samplePoint - offset;
    // vec4 transformedPoint = opTx( vec4(samplePoint, 1.0), translate( -originTransformPoint ) * rotM * translate( originTransformPoint ));
    return opTx( vec4(offsetPoint, 1.0), translate( -originTransformPoint + -offset ) * rotationMatrixIn * translate( originTransformPoint + offset ));
    
}

// float opDisplace( vec3 p )
// {
//     float d1 = primitive(p);
//     float d2 = displacement(p);
//     return d1+d2;
// }

/**
 * Signed distance function describing the scene.
 * 
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) {

    // samplePoint = rotationMatrix(vec3(3.0 * sin(u_time), 2.0, 1.0), u_time / 4.0) * samplePoint;

    // vec2 st = gl_FragCoord.xy/u_res.xy;

    // vec2 pos = vec2(st*2.0);

    // Use the noise function
    // float n = noise(pos);

    // vec2 mouse = u_mouse.xy / u_res.xy;

    // float prism = sdHexPrism(samplePoint, vec2(.2, .1));
    // float torus = sdTorus(samplePoint, vec2(.3, .2 ));
    // float sphere = sdSphere(samplePoint, .3);
    // float plane = sdPlane(samplePoint);
    // float box = sdBox(samplePoint, vec3(.2, .4, .8));

    mat4 rotM = rotationMatrix(vec3(2.0 * sin(u_time), 3.2, 1.0), u_time / 4.0);

    vec3 boxSize = vec3(.2, .2, .2);
    vec3 originTransformPoint = vec3(.8, .4, .6);
    float expandVal = abs(sin(u_time) * 3.0) + .5;

    float miniExpandVal = expandVal * 1.2;

    vec3 miniBoxSize = vec3(.1, .1, .1);
    // float expandVal 

    // mat4 translateM = translate(vec3(.1, 0.2, 0.4));
    // vec4 translatedPoint = opTx(vec4(samplePoint - vec3(.5, .0, .0), 1.0), translateM);
    // vec4 rotatedTranslatedPoint = opTx(translatedPoint, rotM);
    // mat4 translateB = translate(vec3(-.1, -.2, -.4));

    // vec3 offset = vec3(.0, .0, .0) * expandVal;
    // vec3 offsetPoint = samplePoint - offset;
    // // vec4 transformedPoint = opTx( vec4(samplePoint, 1.0), translate( -originTransformPoint ) * rotM * translate( originTransformPoint ));
    // vec4 transformedPoint = opTx( vec4(offsetPoint, 1.0), translate( -originTransformPoint + -offset ) * rotM * translate( originTransformPoint + offset ));
    // float smallBoxes = sdBox(transformedPoint.xyz, boxSize);

    // float smallBoxes = sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.0, .0, .0) * expandVal).xyz, boxSize);

    // smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.0, .4, .0) * expandVal).xyz, boxSize), smallBoxes );
    float smallBoxes = sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.0, .4, .0) * expandVal).xyz, boxSize);

    smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.4, .4, .0) * expandVal).xyz, boxSize), smallBoxes );

    smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.4, .0, .0) * expandVal).xyz, boxSize), smallBoxes );

    smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.0, .0, .4) * expandVal).xyz, boxSize), smallBoxes );

    smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.0, .4, .4) * expandVal).xyz, boxSize), smallBoxes );

    smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.4, .0, .4) * expandVal).xyz, boxSize), smallBoxes );

    // smallBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, vec3(.4, .4, .4) * expandVal).xyz, boxSize), smallBoxes );

    
    vec3 miniOffset = vec3(-.15, -.15, -.15);
    float miniBoxes = sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .0)) * miniExpandVal).xyz, miniBoxSize);

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );



    // miniOffset = vec3(-.15, .35, .35);
    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes);

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    // miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );


    miniOffset = vec3(.35, .35, .35);
    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes);

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.0, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .2, .2)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    miniBoxes = obj_union(sdBox(getTransformedPoint(samplePoint, originTransformPoint, rotM, (miniOffset + vec3(.2, .0, .0)) * miniExpandVal).xyz, miniBoxSize), miniBoxes );

    
   

    
    // vec4 transformedPoints = opTx(vec4(samplePoint, 1.0), translate( vec3(-.2, -.4, -.8) ) * rotM * translate( vec3(.2, .4, .8) ));
    // float box = sdBox(transformedPoints.xyz, vec3(.2, .4, .8));

    // float res = op_union(plane, torus);
    // return sdBox(samplePoint, vec3(.2, .4, .8));
    
    // smallBoxes = obj_union(sdBox(translatedPoint, vec3(.1, .2, .4)), smallBoxes);

    // return obj_union(box, smallBoxes);
    return obj_union(smallBoxes, miniBoxes);
    // return miniBoxes;

    // vec3 c = vec3(4.0, 4.0, 8.0);
    
    // vec3 q = mod(samplePoint, c)-0.5*c;
    // return sdTorus(q, vec2(.8, .4));

    // return sphere;
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
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
            return depth;
        }
        // depth += dist;
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}


/**
 * Lighting contribution of a single point light source via Phong illumination.
 * 
 * The vec3 returned is the RGB color of the light's contribution.
 *
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 * lightPos: the position of the light
 * lightIntensity: color/intensity of the light
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    
    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    } 
    
    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

/**
 * Lighting via Phong illumination.
 * 
 * The vec3 returned is the RGB color of that point after lighting is applied.
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    // vec3 light1Pos = vec3(4.0 * sin(u_time),
    //                       2.0,
    //                       4.0 * cos(u_time));
    // vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    
    // color += phongContribForLight(k_d, k_s, alpha, p, eye,
    //                               light1Pos,
    //                               light1Intensity);
    
    vec3 light2Pos = vec3(2.0,
                          2.0,
                          2.0);
    vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);    
    return color;
}

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 * 
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

/**
 * Return a transform matrix that will transform a ray from view space
 * to world coordinates, given the eye point, the camera target, and an up vector.
 *
 * This assumes that the center of the camera is aligned with the negative z axis in
 * view space when calculating the ray marching direction. See rayDirection.
 */
mat4 viewMatrixFunc(vec3 eye, vec3 center, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}

const float range = 0.05;
const float noiseQuality = 1.0;
const float noiseIntensity = 0.000088;
const float offsetIntensity = 0.2;
const float colorOffsetIntensity = .4;

float verticalBar(float pos, float uvY, float offset) {
    float edge0 = (pos - range);
    float edge1 = (pos + range);

    float x = smoothstep(edge0, pos, uvY) * offset;
    x -= smoothstep(pos, edge1, uvY) * offset;
    return x;
}

vec2 tile(vec2 _st, float _zoom){
    _st *= _zoom;
    return fract(_st);
}


void main() {
	vec2 st = gl_FragCoord.xy/u_res.xy;
    
    // vec2 mouse = u_mouse.xy / u_res.xy;

    // float mx=mouse.x*PI*2.0;
    // float my=mouse.y*PI/2.01;
    // vec3 prp=vec3( cos(my)*cos(mx), sin(my), cos(my)*sin(mx))*6.0 );

    // st = tile(st, 6.0);

    vec2 rotSt = st;

    float rot = 95.0 * (3.14159265359 / 180.0);

    rotSt = rotSt - vec2(.5, .5);

    mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    rotSt  = m * rotSt;

    rotSt = rotSt + vec2(.5, .5);

    // fragColor = tex;

    vec3 textureColor = texture2D(texture, st).rgb;
    vec3 textureColorXOffset = texture2D(texture, rotSt).rgb;
    // vec3 finalColor =;
    
    vec3 finalColor = textureColor + textureColorXOffset;
    
    gl_FragColor = vec4(finalColor, 1.0);
}

