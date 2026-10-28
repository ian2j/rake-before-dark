// Sunset and civil dusk from the standard sunrise equation.
import {rad} from './util.js';

// Sunset and civil dusk from the standard sunrise equation (about a minute of error).
export function sunTimes(now,lat,lon){
  const jd=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate(),12)/864e5+2440587.5;
  const n=Math.round(jd-2451545+0.0008), Js=n-lon/360;
  const M=(357.5291+0.98560028*Js)%360;
  const C=1.9148*Math.sin(M*rad)+0.02*Math.sin(2*M*rad)+0.0003*Math.sin(3*M*rad);
  const L=(M+C+282.9372)%360;
  const Jt=2451545+Js+0.0053*Math.sin(M*rad)-0.0069*Math.sin(2*L*rad);
  const dec=Math.asin(Math.sin(L*rad)*Math.sin(23.4397*rad));
  const at=h=>{const c=(Math.sin(h*rad)-Math.sin(lat*rad)*Math.sin(dec))/(Math.cos(lat*rad)*Math.cos(dec));return (Jt+Math.acos(c)/rad/360-2440587.5)*864e5;};
  return {sunset:at(-0.833),dusk:at(-6)};
}
