import{r as l,p as f,k as L,q as S}from"./index-BpaeRH9L.js";/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=(...r)=>r.filter((e,t,a)=>!!e&&e.trim()!==""&&a.indexOf(e)===t).join(" ").trim();/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=r=>r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=r=>r.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,a)=>a?a.toUpperCase():t.toLowerCase());/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=r=>{const e=R(r);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var m={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=r=>{for(const e in r)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1},k=l.createContext({}),v=()=>l.useContext(k),I=l.forwardRef(({color:r,size:e,strokeWidth:t,absoluteStrokeWidth:a,className:n="",children:o,iconNode:i,...s},u)=>{const{size:c=24,strokeWidth:p=2,absoluteStrokeWidth:g=!1,color:C="currentColor",className:y=""}=v()??{},w=a??g?Number(t??p)*24/Number(e??c):t??p;return l.createElement("svg",{ref:u,...m,width:e??c??m.width,height:e??c??m.height,stroke:r??C,strokeWidth:w,className:h("lucide",y,n),...!o&&!N(s)&&{"aria-hidden":"true"},...s},[...i.map(([x,b])=>l.createElement(x,b)),...Array.isArray(o)?o:[o]])});/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=(r,e)=>{const t=l.forwardRef(({className:a,...n},o)=>l.createElement(I,{ref:o,iconNode:e,className:h(`lucide-${A(d(r))}`,`lucide-${r}`,a),...n}));return t.displayName=d(r),t};/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],j=M("camera",_);function B(r,e){return Array.from(new Set(r.flatMap(t=>{const a=t[e];return(a==null?void 0:a.split(",").map(n=>f(n).trim()).filter(Boolean))??[]}))).sort((t,a)=>t.localeCompare(a))}function W(r,e){return r.filter(t=>{var o,i;if(e.showOnlyWithMedia&&!(t.image&&t.image.trim()!==""&&t.image!=="Unknown")||e.country&&!(t.countries||"").split(",").map(c=>f(c).toLowerCase().trim()).some(c=>c.includes(e.country.toLowerCase()))||e.publishingCountry&&!(t.publishing||"").split(",").map(c=>f(c).toLowerCase().trim()).some(c=>c.includes(e.publishingCountry.toLowerCase())))return!1;const a=e.yearRange?parseInt(e.yearRange[0]):null,n=e.yearRange?parseInt(e.yearRange[1]):null;if(e.month){const s=(o=t.monthsToYears)==null?void 0:o[e.month];if(!s||a!=null&&n!=null&&!s.some(u=>u>=a&&u<=n))return!1}else if(a!=null&&n!=null){const s=parseInt(t.oldest),u=parseInt(t.newest);if(isNaN(s)||isNaN(u)||u<a||s>n)return!1}if(e.hasOccurrenceNotes&&L(t.remarks)==="None"||e.minRecords>0&&t.occurrences<e.minRecords||e.sex&&(((i=t.sex)==null?void 0:i.toLowerCase())||"")!==e.sex.toLowerCase()||e.lifeStage&&S(t).toLowerCase()!==e.lifeStage.toLowerCase())return!1;if(e.observationType){let s=!0;if(e.observationType=="Satellite"?s=t.machine>0:e.observationType=="Human"&&(s=t.human>0),!s)return!1}return!0})}function U(r,e){return W(r,e).filter(a=>{if(e.miewidDistanceRange){const n=a.miewid_match_distance;if(!n||isNaN(n))return!1;const[o,i]=e.miewidDistanceRange;if(n<o||n>i)return!1}if(e.showOnlyConfidentMatches){const n=a.miewid_match_distance;if(!n||isNaN(n)||n>=1)return!1}if(e.plausibility&&a.plausibility!==e.plausibility)return!1;if(e.hasMatchedImages){const n=a.matched_shark_id;if(n&&!r.some(i=>i.id===n))return!1}return!0})}function D(r,e){const t={...e},a=t,n=e;for(const o in e){const i=r.get(o);i&&(Array.isArray(n[o])?a[o]=i.split(","):typeof n[o]=="boolean"?a[o]=i==="true":typeof n[o]=="number"?a[o]=Number(i):a[o]=i)}return t}function E(r,e){const t=new URLSearchParams,a=r,n=e;for(const o in e){const i=a[o],s=n[o];Array.isArray(i)?i.join(",")!==s.join(",")&&t.set(o,i.join(",")):i!==s&&t.set(o,String(i))}return t}export{j as C,M as a,U as b,E as c,B as e,W as f,D as p};
