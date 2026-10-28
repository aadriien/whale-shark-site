import{j as $,r as H}from"./index-DSszWZDk.js";import{V as d,e as h,C as K,l as Z,f as W,M as xe,m as ye,av as Ce,B as Pe,b as U,A as re,d as be,D as Fe,R as Ge,g as ze,W as Ee,aI as _e,F as De,a3 as Le,n as Oe}from"./three.module-lIZQ-nwY.js";import{d as Be,e as Ue}from"./GlobeUtils-Cx06F6qO.js";import{E as Ve,R as Ie,U as He,G as We,d as Ne,a as je,g as qe}from"./RenderUtils-CK24NzVo.js";import"./linear-iax1rWk3.js";import"./sum-G41L2DlF.js";import"./OrbitControls-DuG2zj7s.js";import"./CoordinateUtils-43pHu_lX.js";const ne={wander:.25,seek:.6,linger:.08},Xe={wander:.5,seek:1},ge={min:1.5,max:4},he={min:12,max:20},ve={min:3,max:5},Ye=.75,$e=6,Ke=1.5;function Ze({shark:f,bounds:r,sharkLength:a}){const n=r.getSize(new d).multiplyScalar(-.15),e=r.clone().expandByVector(n),o=new d(1,0,0),c=new d,x=new d,s=new d,m=new d;let u="wander",v=a*ne.wander,P=0,w=0,S=0,R=0;const b=()=>{c.set(h.randFloat(e.min.x,e.max.x),h.randFloat(e.min.y,e.max.y),h.randFloat(e.min.z,e.max.z))};f.position.copy(e.getCenter(new d)),b();const k=l=>{x.copy(c).sub(f.position).normalize(),s.crossVectors(o,x),s.lengthSq()<1e-8&&s.set(0,1,0);const g=Math.min(o.angleTo(x),l);o.applyAxisAngle(s.normalize(),g).normalize()};return{update:l=>{const g=a*Ye,A=f.position.distanceTo(c);R=1-h.smoothstep(A,g,g*2),u==="linger"?(P-=l*(1+$e*(1-R)),(P<=0||R<=0)&&(u="wander",b())):A<g&&(u==="seek"?(u="linger",P=h.randFloat(ve.min,ve.max)):b());const V=a*ne[u];v+=(V-v)*Math.min(1,Ke*l),u!=="linger"&&k(Xe[u]*l),f.position.addScaledVector(o,v*l),m.copy(f.position).add(o),f.up.set(0,1,0),f.lookAt(m),f.rotateX(-Math.PI/2),f.rotateZ(Math.PI),S=h.clamp(v/(a*ne.seek),0,1),w+=l*h.lerp(ge.min,ge.max,S)},setTarget:l=>{c.copy(l),u="seek"},retarget:l=>{u!=="wander"&&c.copy(l)},getState:()=>u,getProximity:()=>R,getRipple:()=>({phase:w,amplitude:h.lerp(he.min,he.max,S)}),getForward:()=>o,getSpeedRatio:()=>S}}function Je(f,r,a,n){if(a<=0)return;const e=f.array;for(let o=0;o<e.length;o+=3){const c=a*(.8+.2*Math.sin(o*.37+n*1.5));e[o]+=(r.r-e[o])*c,e[o+1]+=(r.g-e[o+1])*c,e[o+2]+=(r.b-e[o+2])*c}f.needsUpdate=!0}const le=1.8,Qe=new K(0,Math.pow(.13,le),Math.pow(.28,le)),et=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
    }
`,tt=`
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uShark;
    uniform float uSharkGlow;
    uniform vec2 uCurrent;
    uniform vec3 uGlowTint;
    uniform float uGlowTintAmount;
    varying vec2 vUv;

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
        );
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.03 + vec2(17.1, 9.2);
            a *= 0.5;
        }
        return v;
    }

    // Bright ridges where noise crosses 0.5, which reads as refracted light
    float causticLayer(vec2 p, vec2 drift) {
        float n = noise(p + drift);
        return pow(1.0 - abs(n * 2.0 - 1.0), 8.0);
    }

    void main() {
        vec2 uv = vUv;
        vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

        // Depth: abyss at bottom, sunlit teal near surface
        vec3 deep = vec3(0.0, 0.025, 0.10);
        vec3 mid = vec3(0.0, 0.13, 0.28);
        vec3 shallow = vec3(0.08, 0.42, 0.60);

        vec3 col = mix(deep, mid, smoothstep(0.0, 0.6, uv.y));
        col = mix(col, shallow, pow(smoothstep(0.55, 1.0, uv.y), 1.5) * 0.7);

        // Slow drifting murk, carried along by gusts
        float murk = fbm(p * 1.2 + vec2(uTime * 0.02, -uTime * 0.015) - uCurrent * 2.0);
        col += vec3(0.02, 0.07, 0.10) * murk;

        // Light shafts fanning from a point above the screen, bent by noise
        vec2 source = vec2(0.15 * sin(uTime * 0.05), 0.85);
        vec2 toPixel = p - source;
        float angle = atan(toPixel.x, -toPixel.y);

        float shafts = noise(vec2(angle * 7.0 + uTime * 0.05, uTime * 0.03)) * 0.6
                     + noise(vec2(angle * 15.0 - uTime * 0.04, 3.0)) * 0.4;
        shafts = smoothstep(0.45, 0.9, shafts);

        // Each shaft breathes on its own, as surface swell passes overhead
        shafts *= 0.65 + 0.7 * noise(vec2(angle * 4.0 + 7.0, uTime * 0.35));

        // Overall surface light wavers gently, from incommensurate slow sines so it never repeats
        float flicker = 1.0 + 0.12 * sin(uTime * 0.9)
                            + 0.08 * sin(uTime * 1.7 + 2.1)
                            + 0.05 * sin(uTime * 3.1 + 0.6);

        float reach = exp(-length(toPixel) * 1.5);
        col += vec3(0.14, 0.38, 0.48) * shafts * reach * 0.7 * flicker;

        // Caustic shimmer, strongest near surface
        float caustics = causticLayer(p * 5.0, vec2(uTime * 0.10, uTime * 0.07))
                       + causticLayer(p * 8.0, vec2(-uTime * 0.08, uTime * 0.11));
        col += vec3(0.10, 0.30, 0.38) * caustics * 0.18 * flicker * smoothstep(0.25, 1.0, uv.y);

        // Shark lights the water around itself
        vec2 sharkP = vec2((uShark.x - 0.5) * uAspect, uShark.y - 0.5);
        float sharkDist = distance(p, sharkP);
        vec3 glowColor = mix(vec3(0.10, 0.34, 0.55), uGlowTint, uGlowTintAmount);
        col += glowColor * exp(-sharkDist * sharkDist * 14.0) * uSharkGlow;

        col *= 1.0 - clamp(dot(p, p) * 0.8, 0.0, 0.7);

        // Dither to hide banding in dark gradients
        col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;

        // Composer's final pass sRGB-encodes frame, so hand it linear to land on authored colors
        gl_FragColor = vec4(pow(col, vec3(${le.toFixed(2)})), 1.0);
    }
`;function ot(f){const r=new Z({vertexShader:et,fragmentShader:tt,depthTest:!1,depthWrite:!1,uniforms:{uTime:{value:0},uAspect:{value:1},uShark:{value:new W(.5,.5)},uSharkGlow:{value:0},uCurrent:{value:new W},uGlowTint:{value:new K},uGlowTintAmount:{value:0}}}),a=new xe(new ye(2,2),r);return a.frustumCulled=!1,a.renderOrder=-1e3,f.add(a),{update:(c,x,s,m,u)=>{r.uniforms.uTime.value=c,r.uniforms.uAspect.value=x,r.uniforms.uShark.value.copy(s),r.uniforms.uSharkGlow.value=m,r.uniforms.uCurrent.value.set(u.x,u.y)},setGlowTint:(c,x)=>{r.uniforms.uGlowTint.value.copy(c),r.uniforms.uGlowTintAmount.value=x},dispose:()=>{a.geometry.dispose(),r.dispose()}}}const X=220,at=.9,we=1.2,Te=.5,nt=Te*.8,Se={min:.15,max:.5},Ae=`
    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }

    vec3 pastel(float hue, float seed) {
        float accent = step(0.82, fract(seed * 5.3)) * 0.14;
        float h = fract(hue + (seed - 0.5) * 0.12 + accent);
        return hsl2rgb(vec3(h, 0.6, 0.74));
    }
`,st=`
    attribute vec3 aOffset;
    attribute float aSeed;

    uniform float uTime;
    uniform float uAge;
    uniform float uPresence;
    uniform float uLinger;
    uniform float uRadius;
    uniform float uRingSeconds;
    uniform float uPixelScale;
    uniform vec3 uDrift;

    varying float vAlpha;
    varying float vMix;

    void main() {
        float angle = aSeed * 6.2831853;

        float ringT = clamp(uAge / uRingSeconds, 0.0, 1.0);
        float ringRadius = (1.0 - pow(1.0 - ringT, 3.0)) * uRadius;
        vec3 ringPos = vec3(cos(angle), sin(angle), 0.0) * ringRadius;

        // Layered slow flow, so blob churns like a small eddy instead of orbiting in lockstep
        float t = uTime * (0.25 + aSeed * 0.3);
        vec3 flow = vec3(
            sin(t + aOffset.y * 3.0 + aSeed * 20.0) + 0.5 * sin(t * 2.3 + aOffset.z * 5.0),
            cos(t * 0.8 + aOffset.z * 3.0 + aSeed * 11.0) + 0.5 * cos(t * 1.9 + aOffset.x * 5.0),
            sin(t * 1.1 + aOffset.x * 3.0 + aSeed * 7.0) + 0.5 * sin(t * 2.1 + aOffset.y * 5.0)
        );

        vec3 blobPos = aOffset * uRadius * 0.6;
        blobPos += flow * uRadius * 0.07;

        // Slow breathing, out of phase across the blob
        blobPos *= 1.0 + 0.07 * sin(uTime * 0.55 + dot(aOffset, vec3(1.0)) * 2.0);

        // Blob draws inward while shark feeds
        blobPos *= 1.0 - 0.35 * uLinger;

        // Strays peel away on a gentle current the longer blob goes unvisited,
        // then are drawn back once shark arrives to feed
        float stray = smoothstep(0.5, 1.0, fract(aSeed * 7.31));
        float unvisited = 1.0 - exp(-max(uAge - uRingSeconds * 2.0, 0.0) * 0.06);
        float strayAmount = stray * unvisited * (1.0 - uLinger);

        vec3 current = normalize(vec3(0.8 + aOffset.x * 0.5, aOffset.y * 0.5, aOffset.z * 0.4));
        blobPos += current * uRadius * 1.2 * strayAmount;

        // Unvisited blob slowly stretches along the current & sinks, like it's loosening
        blobPos.x *= 1.0 + 0.4 * unvisited * (1.0 - uLinger);
        blobPos.y -= uRadius * 0.12 * unvisited * (1.0 - uLinger);

        // Ocean gusts carry lure, each speck by a different amount so blob smears & disperses
        float carried = 0.4 + 0.8 * fract(aSeed * 3.7);
        blobPos += uDrift * carried;

        float morph = smoothstep(uRingSeconds * 0.55, uRingSeconds * 2.0, uAge);
        vec4 mvPosition = modelViewMatrix * vec4(mix(ringPos, blobPos, morph), 1.0);

        float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 40.0);

        gl_PointSize = uPixelScale * (0.6 + aSeed * 0.8) * (1.0 + 0.6 * uLinger) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = uPresence * twinkle * (0.6 + 0.4 * uLinger) * (1.0 - 0.5 * strayAmount);
        vMix = aSeed;
    }
`,it=`
    uniform float uHue;

    varying float vAlpha;
    varying float vMix;

    ${Ae}

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float soft = smoothstep(0.5, 0.0, dist);

        vec3 color = pastel(uHue, vMix);
        gl_FragColor = vec4(pow(color, vec3(2.2)), soft * soft * vAlpha);
    }
`,rt=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,lt=`
    uniform float uAge;
    uniform float uPresence;
    uniform float uRingSeconds;
    uniform float uRingMax;
    uniform float uHue;
    varying vec2 vUv;

    ${Ae}

    float ringAt(float r, float age) {
        float t = clamp(age / uRingSeconds, 0.0, 1.0);
        float ringRadius = (1.0 - pow(1.0 - t, 3.0)) * uRingMax;
        float thickness = 0.015 + 0.03 * t;
        float x = (r - ringRadius) / thickness;
        return exp(-x * x) * (1.0 - t * 0.6);
    }

    void main() {
        float r = length(vUv - vec2(0.5)) * 2.0;

        float rings = ringAt(r, uAge) + 0.5 * ringAt(r, uAge - 0.25);
        float fade = 1.0 - smoothstep(uRingSeconds * 0.55, uRingSeconds * 1.8, uAge);

        vec3 color = pow(pastel(uHue, 0.5), vec3(2.2));
        gl_FragColor = vec4(color, rings * fade * uPresence);
    }
`;function ct(f,r){const a={uTime:{value:0},uAge:{value:0},uPresence:{value:0},uLinger:{value:0},uRadius:{value:r},uRingSeconds:{value:at},uPixelScale:{value:1},uRingMax:{value:1/we},uHue:{value:Math.random()},uDrift:{value:new d}},n=new Ce;n.visible=!1,f.add(n);const e=new Float32Array(X*3),o=new Float32Array(X);for(let t=0;t<X;t++){let l,g,A;do l=Math.random()*2-1,g=Math.random()*2-1,A=Math.random()*2-1;while(l*l+g*g+A*A>1);e[t*3]=l,e[t*3+1]=g,e[t*3+2]=A,o[t]=Math.random()}const c=new Pe;c.setAttribute("position",new U(new Float32Array(X*3),3)),c.setAttribute("aOffset",new U(e,3)),c.setAttribute("aSeed",new U(o,1));const x=new Z({vertexShader:st,fragmentShader:it,uniforms:a,transparent:!0,blending:re,depthWrite:!1,depthTest:!1}),s=new be(c,x);s.frustumCulled=!1,n.add(s);const m=new ye(2,2),u=new Z({vertexShader:rt,fragmentShader:lt,uniforms:a,transparent:!0,blending:re,depthWrite:!1,depthTest:!1,side:Fe}),v=new xe(m,u);v.scale.setScalar(r*we),v.frustumCulled=!1,n.add(v);const P=new d,w=new d;let S=!1,R=0,b=0,k=0;return{trigger:t=>{P.copy(t),S=!0},update:(t,l,g,A,V)=>{const N=S||g==="wander"?0:1,O=S?12:N?4:1.5;b+=(N-b)*Math.min(1,O*t),S&&b<.02&&(n.position.copy(P),w.copy(A),a.uHue.value=(a.uHue.value+h.randFloat(Se.min,Se.max))%1,R=0,S=!1);const j=g==="linger"?V:0,q=j<k?6:2;k+=(j-k)*Math.min(1,q*t),R+=t,a.uTime.value=l,a.uAge.value=R,a.uPresence.value=b,a.uLinger.value=k,a.uDrift.value.copy(A).sub(w).multiplyScalar(Te),n.visible=b>.001},getCore:t=>S?t.copy(P):t.copy(n.position).addScaledVector(a.uDrift.value,nt),getHue:()=>a.uHue.value,getFeeding:()=>k,setViewport:(t,l)=>{const g=t/(2*Math.tan(h.degToRad(l)/2));a.uPixelScale.value=g*r*.15},dispose:()=>{c.dispose(),x.dispose(),m.dispose(),u.dispose()}}}const Y=2500,E={waitSeconds:{min:10,max:25},durationSeconds:{min:5,max:9},peakSpeed:{min:.04,max:.09}},ut=`
    attribute vec3 aBase;
    attribute float aSeed;

    uniform float uTime;
    uniform vec3 uMin;
    uniform vec3 uSize;
    uniform vec3 uShark;
    uniform vec3 uDir;
    uniform float uSpeed;
    uniform float uReach;
    uniform float uPixelScale;
    uniform vec3 uGust;

    varying float vAlpha;

    void main() {
        vec3 p = aBase;

        vec3 drift = vec3(0.010, -0.018, 0.004) * (0.6 + aSeed * 0.8);
        p += drift * uTime;
        p.x += sin(uTime * 0.3 + aSeed * 30.0) * 0.012;
        p.y += cos(uTime * 0.25 + aSeed * 17.0) * 0.010;

        // Gust is accumulated offset, nearer specks carried further for parallax
        p += uGust * (0.5 + aBase.z);
        p = fract(p);

        // Fade at volume edges so wrapping never pops
        vec3 lo = smoothstep(vec3(0.0), vec3(0.06), p);
        vec3 hi = 1.0 - smoothstep(vec3(0.94), vec3(1.0), p);
        float edge = lo.x * lo.y * lo.z * hi.x * hi.y * hi.z;

        vec3 world = uMin + p * uSize;

        // Wake: capsule trailing behind shark, pushing specks outward & swirling them
        vec3 tail = uShark - uDir * uReach * 2.0;
        vec3 ab = uShark - tail;
        float h = clamp(dot(world - tail, ab) / dot(ab, ab), 0.0, 1.0);
        vec3 away = world - (tail + ab * h);
        float dist = length(away);

        float influence = exp(-(dist * dist) / (uReach * uReach));
        influence *= mix(0.35, 1.0, h) * (0.4 + 0.6 * uSpeed);

        vec3 outward = away / max(dist, 0.001);
        vec3 swirl = cross(uDir, outward);
        float phase = uTime * 2.0 + h * 6.0 + aSeed * 6.2831853;

        world += (outward * 0.35 + swirl * sin(phase) * 0.5) * influence * uReach * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(world, 1.0);
        gl_PointSize = uPixelScale * (0.5 + aSeed) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        // Distant specks dimmer, specks in shark's wake catch its light
        float depthFade = 0.35 + 0.65 * p.z;
        vAlpha = edge * depthFade * (0.35 + 0.9 * influence);
    }
`,dt=`
    varying float vAlpha;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float soft = smoothstep(0.5, 0.0, dist);

        gl_FragColor = vec4(pow(vec3(0.70, 0.90, 1.0), vec3(2.2)), soft * soft * vAlpha);
    }
`;function ft(f,r,a){const n={uTime:{value:0},uMin:{value:new d},uSize:{value:new d(1,1,1)},uShark:{value:new d},uDir:{value:new d(1,0,0)},uSpeed:{value:0},uReach:{value:a*.6},uPixelScale:{value:1},uGust:{value:new d}},e=new d;let o=0,c=0,x=h.randFloat(E.waitSeconds.min,E.waitSeconds.max),s=0;const m=new Float32Array(Y*3),u=new Float32Array(Y);for(let i=0;i<Y;i++)m[i*3]=Math.random(),m[i*3+1]=Math.random(),m[i*3+2]=Math.random(),u[i]=Math.random();const v=new Pe;v.setAttribute("position",new U(new Float32Array(Y*3),3)),v.setAttribute("aBase",new U(m,3)),v.setAttribute("aSeed",new U(u,1));const P=new Z({vertexShader:ut,fragmentShader:dt,uniforms:n,transparent:!0,blending:re,depthWrite:!1,depthTest:!1}),w=new be(v,P);return w.frustumCulled=!1,w.renderOrder=-10,f.add(w),{fit:i=>{const y=Math.tan(h.degToRad(i.fov)/2)*(i.position.z-r.min),T=y*i.aspect;n.uMin.value.set(i.position.x-T,i.position.y-y,r.min),n.uSize.value.set(T*2,y*2,r.max-r.min)},setViewport:(i,y)=>{const T=i/(2*Math.tan(h.degToRad(y)/2));n.uPixelScale.value=T*a*.015},update:(i,y,T,G)=>{const F=Math.min(Math.max(i-s,0),.1);if(s=i,c===0&&i>=x){const t=(Math.random()-.5)*1.2,l=Math.random()<.75?1:-1;e.set(Math.cos(t)*l,Math.sin(t)*.3,0),e.multiplyScalar(h.randFloat(E.peakSpeed.min,E.peakSpeed.max)),o=i,c=h.randFloat(E.durationSeconds.min,E.durationSeconds.max)}if(c>0){const t=(i-o)/c;if(t>=1)c=0,x=i+h.randFloat(E.waitSeconds.min,E.waitSeconds.max);else{const l=Math.pow(Math.sin(Math.PI*t),2);n.uGust.value.addScaledVector(e,l*F)}}n.uTime.value=i,n.uShark.value.copy(y),n.uDir.value.copy(T),n.uSpeed.value=G},getGustOffset:()=>n.uGust.value,getGustWorld:i=>i.copy(n.uGust.value).multiply(n.uSize.value),dispose:()=>{v.dispose(),P.dispose()}}}const se={strength:.3,radius:.5,threshold:.7},ie={gain:.8,fogMix:.5,pointScale:1.25},mt=1.5,pt=.12;function At(){return $.jsx("div",{className:"aquarium-wrapper",children:$.jsx("div",{style:{width:"100vw",height:"100vh"},children:$.jsx(gt,{})})})}function gt(){const f=H.useRef(null),r=H.useRef(null),a=H.useRef(new Ge),n=H.useRef(new W);return H.useEffect(()=>{const e=f.current;if(!e)return;const o=new ze,{ambientLight:c,directionalLight:x}=Be();o.add(c),o.add(x);const s=Ue(e);r.current=s;const m=new Ee({antialias:!1,powerPreference:"high-performance"}),u=new Ve(m);u.addPass(new Ie(o,s));const v=new He(new W(e.clientWidth,e.clientHeight),se.strength,se.radius,se.threshold);u.addPass(v);const P=ot(o),{shark:w,geometry:S,curve:R,animateBody:b}=We();w.scale.set(1,1,1),o.add(w);const k=w.material;k.size*=ie.pointScale,k.onBeforeCompile=p=>{p.uniforms.uDepthGain={value:ie.gain},p.uniforms.uFogMix={value:ie.fogMix},p.fragmentShader=`uniform float uDepthGain;
uniform float uFogMix;
`+p.fragmentShader.replace("#include <fog_fragment>",`
                    #ifdef USE_FOG
                        float depthT = smoothstep(fogNear, fogFar, vFogDepth);
                        gl_FragColor.rgb *= 1.0 + uDepthGain * depthT;
                        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, depthT * uFogMix);
                    #endif
                    `)},S.computeBoundingSphere();const L=S.boundingSphere.radius,C=ct(o,L*.6),i=new _e().setFromPoints(R.getPoints(200)),y=i.getSize(new d),T=i.getCenter(new d),G=i.clone();G.min.z-=y.z;const F=ft(o,{min:G.min.z,max:G.max.z},L*2),t=Ze({shark:w,bounds:G,sharkLength:L*2}),l=new De(Qe,1,1e3);o.fog=l;const g=new d,A=y.x*.01,V=y.y*.01,N=new Le().setFromNormalAndCoplanarPoint(new d(0,0,1),T),O=new d,j=()=>{const p=h.degToRad(s.fov)/2,M=Math.atan(Math.tan(p)*s.aspect),z=Math.max(y.y/2/Math.tan(p),y.x/2/Math.tan(M));s.position.set(T.x,T.y,i.max.z+z),g.copy(s.position);const B=(s.position.z-G.min.z)*1.5;s.far=B,l.near=z,l.far=B},q=()=>{if(!e.offsetWidth||!e.offsetHeight)return;const p=e.offsetWidth,M=e.offsetHeight,z=qe(mt);m.setPixelRatio(z),m.setSize(p,M),u.setPixelRatio(z),u.setSize(p,M),s.aspect=p/M,j(),s.updateProjectionMatrix(),C.setViewport(m.domElement.height,s.fov),F.fit(s),F.setViewport(m.domElement.height,s.fov)};(()=>{e.contains(m.domElement)||e.appendChild(m.domElement),q()})();const ce=p=>{if(!f.current||!r.current)return;const M=f.current.getBoundingClientRect();n.current.x=(p.clientX-M.left)/M.width*2-1,n.current.y=-((p.clientY-M.top)/M.height)*2+1,console.log(`X: ${n.current.x} and Y: ${n.current.y}`),a.current.setFromCamera(n.current,r.current),a.current.ray.intersectPlane(N,O)?(t.setTarget(O),C.trigger(O),console.log(O)):console.log("No intersection with globe.")};let J=0;const ue=()=>{cancelAnimationFrame(J),J=requestAnimationFrame(q)};window.addEventListener("resize",ue),e.addEventListener("click",ce);const _=new Oe;let de=0;const Me=new d,Re=new d,Q=new K,fe=new K;let I=0,D=0;const ee=new d,me=new W;let te=0;const pe=()=>{const p=Math.min(_.getDelta(),.1);t.retarget(C.getCore(Re)),t.update(p);const{phase:M,amplitude:z}=t.getRipple();b(_.elapsedTime,M,z);const B=C.getFeeding();if(B>.05)if(D<.01)I=C.getHue();else{let ae=C.getHue()-I;ae-=Math.round(ae),I=(I+ae*Math.min(1,3*p)+1)%1}D+=B>D?(B-D)*Math.min(1,1.5*p):-D*Math.min(1,pt*p),Q.setHSL(I,.6,.74),Je(S.attributes.color,Q,D,_.elapsedTime),fe.copy(Q).multiplyScalar(.5),P.setGlowTint(fe,D),C.update(p,_.elapsedTime,t.getState(),F.getGustWorld(Me),t.getProximity()),F.update(_.elapsedTime,w.position,t.getForward(),t.getSpeedRatio());const oe=_.elapsedTime;s.position.set(g.x+Math.sin(oe*.11)*A,g.y+Math.sin(oe*.07+1.3)*V,g.z),s.rotation.z=Math.sin(oe*.05)*.006,s.updateMatrixWorld();const ke=t.getState()==="wander"?.6:1;te+=(ke-te)*Math.min(1,2*p),ee.copy(w.position).project(s),me.set(ee.x*.5+.5,ee.y*.5+.5),P.update(_.elapsedTime,s.aspect,me,te,F.getGustOffset()),u.render(),de=requestAnimationFrame(pe)};return pe(),()=>{cancelAnimationFrame(de),cancelAnimationFrame(J),window.removeEventListener("resize",ue),e.removeEventListener("click",ce),e.contains(m.domElement)&&e.removeChild(m.domElement),F.dispose(),C.dispose(),P.dispose(),Ne(o),je(m,u)}},[]),$.jsx("div",{ref:f,style:{width:"100%",height:"100%"}})}export{At as default};
