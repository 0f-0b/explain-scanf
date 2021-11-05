import{EditorSelection as s,CharCategory as L}from"../../state@0.19.3/es2021/state.js";import{Text as q,findClusterBreak as A,countColumn as j}from"../../text@0.19.5/es2021/text.js";import{Direction as d,EditorView as Me,PluginField as Re}from"../../view@0.19.12/es2021/view.js";import{matchBrackets as k}from"../../matchbrackets@0.19.3/es2021/matchbrackets.js";import{IndentContext as _,getIndentation as $,indentString as x,indentUnit as Ee,getIndentUnit as V,syntaxTree as v}from"../../language@0.19.3/es2021/language.js";import{NodeProp as G}from"../../../@lezer/common@0.15.7/es2021/common.js";function g(e,t){return s.create(e.ranges.map(t),e.mainIndex)}function p(e,t){return e.update({selection:t,scrollIntoView:!0,userEvent:"select"})}function h({state:e,dispatch:t},r){let n=g(e.selection,r);return n.eq(e.selection)?!1:(t(p(e,n)),!0)}function B(e,t){return s.cursor(t?e.to:e.from)}function C(e,t){return h(e,r=>r.empty?e.moveByChar(r,t):B(r,t))}var J=e=>C(e,e.textDirection!=d.LTR),Q=e=>C(e,e.textDirection==d.LTR),yt=e=>C(e,!0),pt=e=>C(e,!1);function D(e,t){return h(e,r=>r.empty?e.moveByGroup(r,t):B(r,t))}var Te=e=>D(e,e.textDirection!=d.LTR),Ie=e=>D(e,e.textDirection==d.LTR),kt=e=>D(e,!0),gt=e=>D(e,!1);function X(e,t,r){let n=e.state.charCategorizer(t.from);return e.moveByChar(t,r,l=>{let o=L.Space,c=t.from,u=!1,i=!1,f=!1,a=y=>{if(u)return!1;c+=r?y.length:-y.length;let K=n(y),P;if(o==L.Space&&(o=K),o!=K)return!1;if(o==L.Word)if(y.toLowerCase()==y){if(!r&&i)return!1;f=!0}else if(f){if(r)return!1;u=!0}else{if(i&&r&&n(P=e.state.sliceDoc(c,c+1))==L.Word&&P.toLowerCase()==P)return!1;i=!0}return!0};return a(l),a})}function Y(e,t){return h(e,r=>r.empty?X(e,r,t):B(r,t))}var Bt=e=>Y(e,!0),Lt=e=>Y(e,!1);function Pe(e,t,r){if(t.type.prop(r))return!0;let n=t.to-t.from;return n&&(n>2||/[^\s,.;:]/.test(e.sliceDoc(t.from,t.to)))||t.firstChild}function S(e,t,r){let n=v(e).resolveInner(t.head),l=r?G.closedBy:G.openedBy;for(let i=t.head;;){let f=r?n.childAfter(i):n.childBefore(i);if(!f)break;Pe(e,f,l)?n=f:i=r?f.to:f.from}let o=n.type.prop(l),c,u;return o&&(c=r?k(e,n.from,1):k(e,n.to,-1))&&c.matched?u=r?c.end.to:c.end.from:u=r?n.to:n.from,s.cursor(u,r?-1:1)}var Ve=e=>h(e,t=>S(e.state,t,e.textDirection!=d.LTR)),ve=e=>h(e,t=>S(e.state,t,e.textDirection==d.LTR));function Z(e,t){return h(e,r=>{if(!r.empty)return B(r,t);let n=e.moveVertically(r,t);return n.head!=r.head?n:e.moveToLineBoundary(r,t)})}var ee=e=>Z(e,!1),te=e=>Z(e,!0);function re(e,t){return h(e,r=>r.empty?e.moveVertically(r,t,e.dom.clientHeight):B(r,t))}var U=e=>re(e,!1),O=e=>re(e,!0);function b(e,t,r){let n=e.visualLineAt(t.head),l=e.moveToLineBoundary(t,r);if(l.head==t.head&&l.head!=(r?n.to:n.from)&&(l=e.moveToLineBoundary(t,r,!1)),!r&&l.head==n.from&&n.length){let o=/^\s*/.exec(e.state.sliceDoc(n.from,Math.min(n.from+100,n.to)))[0].length;o&&t.head!=n.from+o&&(l=s.cursor(n.from+o))}return l}var ne=e=>h(e,t=>b(e,t,!0)),oe=e=>h(e,t=>b(e,t,!1)),Ge=e=>h(e,t=>s.cursor(e.visualLineAt(t.head).from,1)),Ue=e=>h(e,t=>s.cursor(e.visualLineAt(t.head).to,-1));function le(e,t,r){let n=!1,l=g(e.selection,o=>{let c=k(e,o.head,-1)||k(e,o.head,1)||o.head>0&&k(e,o.head-1,1)||o.head<e.doc.length&&k(e,o.head+1,-1);if(!c||!c.end)return o;n=!0;let u=c.start.from==o.head?c.end.to:c.end.from;return r?s.range(o.anchor,u):s.cursor(u)});return n?(t(p(e,l)),!0):!1}var Oe=({state:e,dispatch:t})=>le(e,t,!1),At=({state:e,dispatch:t})=>le(e,t,!0);function m(e,t){let r=g(e.state.selection,n=>{let l=t(n);return s.range(n.anchor,l.head,l.goalColumn)});return r.eq(e.state.selection)?!1:(e.dispatch(p(e.state,r)),!0)}function M(e,t){return m(e,r=>e.moveByChar(r,t))}var ce=e=>M(e,e.textDirection!=d.LTR),ue=e=>M(e,e.textDirection==d.LTR),xt=e=>M(e,!0),Ct=e=>M(e,!1);function R(e,t){return m(e,r=>e.moveByGroup(r,t))}var Fe=e=>R(e,e.textDirection!=d.LTR),we=e=>R(e,e.textDirection==d.LTR),Dt=e=>R(e,!0),St=e=>R(e,!1);function ie(e,t){return m(e,r=>X(e,r,t))}var bt=e=>ie(e,!0),Mt=e=>ie(e,!1),ze=e=>m(e,t=>S(e.state,t,e.textDirection!=d.LTR)),He=e=>m(e,t=>S(e.state,t,e.textDirection==d.LTR));function se(e,t){return m(e,r=>e.moveVertically(r,t))}var fe=e=>se(e,!1),ae=e=>se(e,!0);function de(e,t){return m(e,r=>e.moveVertically(r,t,e.dom.clientHeight))}var he=e=>de(e,!1),me=e=>de(e,!0),ye=e=>m(e,t=>b(e,t,!0)),pe=e=>m(e,t=>b(e,t,!1)),Ne=e=>m(e,t=>s.cursor(e.visualLineAt(t.head).from)),We=e=>m(e,t=>s.cursor(e.visualLineAt(t.head).to)),F=({state:e,dispatch:t})=>(t(p(e,{anchor:0})),!0),w=({state:e,dispatch:t})=>(t(p(e,{anchor:e.doc.length})),!0),ke=({state:e,dispatch:t})=>(t(p(e,{anchor:e.selection.main.anchor,head:0})),!0),ge=({state:e,dispatch:t})=>(t(p(e,{anchor:e.selection.main.anchor,head:e.doc.length})),!0),Ke=({state:e,dispatch:t})=>(t(e.update({selection:{anchor:0,head:e.doc.length},userEvent:"select"})),!0),qe=({state:e,dispatch:t})=>{let r=I(e).map(({from:n,to:l})=>s.range(n,Math.min(l+1,e.doc.length)));return t(e.update({selection:s.create(r),userEvent:"select"})),!0},je=({state:e,dispatch:t})=>{let r=g(e.selection,n=>{var l;let o=v(e).resolveInner(n.head,1);for(;!(o.from<n.from&&o.to>=n.to||o.to>n.to&&o.from<=n.from||!((l=o.parent)===null||l===void 0?void 0:l.parent));)o=o.parent;return s.range(o.to,o.from)});return t(p(e,r)),!0},_e=({state:e,dispatch:t})=>{let r=e.selection,n=null;return r.ranges.length>1?n=s.create([r.main]):r.main.empty||(n=s.create([s.cursor(r.main.head)])),n?(t(p(e,n)),!0):!1};function E({state:e,dispatch:t},r){if(e.readOnly)return!1;let n="delete.selection",l=e.changeByRange(o=>{let{from:c,to:u}=o;if(c==u){let i=r(c);i<c?n="delete.backward":i>c&&(n="delete.forward"),c=Math.min(c,i),u=Math.max(u,i)}return c==u?{range:o}:{changes:{from:c,to:u},range:s.cursor(c)}});return l.changes.empty?!1:(t(e.update(l,{scrollIntoView:!0,userEvent:n})),!0)}function T(e,t,r){if(e instanceof Me)for(let n of e.pluginField(Re.atomicRanges))n.between(t,t,(l,o)=>{l<t&&o>t&&(t=r?o:l)});return t}var Be=(e,t)=>E(e,r=>{let{state:n}=e,l=n.doc.lineAt(r),o,c;if(!t&&r>l.from&&r<l.from+200&&!/[^ \t]/.test(o=l.text.slice(0,r-l.from))){if(o[o.length-1]=="	")return r-1;let u=j(o,n.tabSize),i=u%V(n)||V(n);for(let f=0;f<i&&o[o.length-1-f]==" ";f++)r--;c=r}else c=A(l.text,r-l.from,t)+l.from,c==r&&l.number!=(t?n.doc.lines:1)&&(c+=t?1:-1);return T(e,c,t)}),z=e=>Be(e,!1),H=e=>Be(e,!0),Le=(e,t)=>E(e,r=>{let n=r,{state:l}=e,o=l.doc.lineAt(n),c=l.charCategorizer(n);for(let u=null;;){if(n==(t?o.to:o.from)){n==r&&o.number!=(t?l.doc.lines:1)&&(n+=t?1:-1);break}let i=A(o.text,n-o.from,t)+o.from,f=o.text.slice(Math.min(n,i)-o.from,Math.max(n,i)-o.from),a=c(f);if(u!=null&&a!=u)break;(f!=" "||n!=r)&&(u=a),n=i}return T(e,n,t)}),Ae=e=>Le(e,!1),$e=e=>Le(e,!0),xe=e=>E(e,t=>{let r=e.visualLineAt(t).to;return T(e,t<r?r:Math.min(e.state.doc.length,t+1),!0)}),Je=e=>E(e,t=>{let r=e.visualLineAt(t).from;return T(e,t>r?r:Math.max(0,t-1),!1)}),Rt=({state:e,dispatch:t})=>{if(e.readOnly)return!1;let r=[];for(let n=0,l="",o=e.doc.iter();;){if(o.next(),o.lineBreak||o.done){let c=l.search(/\s+$/);if(c>-1&&r.push({from:n-(l.length-c),to:n}),o.done)break;l=""}else l=o.value;n+=o.value.length}return r.length?(t(e.update({changes:r,userEvent:"delete"})),!0):!1},Qe=({state:e,dispatch:t})=>{if(e.readOnly)return!1;let r=e.changeByRange(n=>({changes:{from:n.from,to:n.to,insert:q.of(["",""])},range:s.cursor(n.from)}));return t(e.update(r,{scrollIntoView:!0,userEvent:"input"})),!0},Xe=({state:e,dispatch:t})=>{if(e.readOnly)return!1;let r=e.changeByRange(n=>{if(!n.empty||n.from==0||n.from==e.doc.length)return{range:n};let l=n.from,o=e.doc.lineAt(l),c=l==o.from?l-1:A(o.text,l-o.from,!1)+o.from,u=l==o.to?l+1:A(o.text,l-o.from,!0)+o.from;return{changes:{from:c,to:u,insert:e.doc.slice(l,u).append(e.doc.slice(c,l))},range:s.cursor(u)}});return r.changes.empty?!1:(t(e.update(r,{scrollIntoView:!0,userEvent:"move.character"})),!0)};function I(e){let t=[],r=-1;for(let n of e.selection.ranges){let l=e.doc.lineAt(n.from),o=e.doc.lineAt(n.to);if(!n.empty&&n.to==o.from&&(o=e.doc.lineAt(n.to-1)),r>=l.number){let c=t[t.length-1];c.to=o.to,c.ranges.push(n)}else t.push({from:l.from,to:o.to,ranges:[n]});r=o.number+1}return t}function Ce(e,t,r){if(e.readOnly)return!1;let n=[],l=[];for(let o of I(e)){if(r?o.to==e.doc.length:o.from==0)continue;let c=e.doc.lineAt(r?o.to+1:o.from-1),u=c.length+1;if(r){n.push({from:o.to,to:c.to},{from:o.from,insert:c.text+e.lineBreak});for(let i of o.ranges)l.push(s.range(Math.min(e.doc.length,i.anchor+u),Math.min(e.doc.length,i.head+u)))}else{n.push({from:c.from,to:o.from},{from:o.to,insert:e.lineBreak+c.text});for(let i of o.ranges)l.push(s.range(i.anchor-u,i.head-u))}}return n.length?(t(e.update({changes:n,scrollIntoView:!0,selection:s.create(l,e.selection.mainIndex),userEvent:"move.line"})),!0):!1}var Ye=({state:e,dispatch:t})=>Ce(e,t,!1),Ze=({state:e,dispatch:t})=>Ce(e,t,!0);function De(e,t,r){if(e.readOnly)return!1;let n=[];for(let l of I(e))r?n.push({from:l.from,insert:e.doc.slice(l.from,l.to)+e.lineBreak}):n.push({from:l.to,insert:e.lineBreak+e.doc.slice(l.from,l.to)});return t(e.update({changes:n,scrollIntoView:!0,userEvent:"input.copyline"})),!0}var et=({state:e,dispatch:t})=>De(e,t,!1),tt=({state:e,dispatch:t})=>De(e,t,!0),rt=e=>{if(e.state.readOnly)return!1;let{state:t}=e,r=t.changes(I(t).map(({from:l,to:o})=>(l>0?l--:o<t.doc.length&&o++,{from:l,to:o}))),n=g(t.selection,l=>e.moveVertically(l,!0)).map(r);return e.dispatch({changes:r,selection:n,scrollIntoView:!0,userEvent:"delete.line"}),!0},Et=({state:e,dispatch:t})=>(t(e.update(e.replaceSelection(e.lineBreak),{scrollIntoView:!0,userEvent:"input"})),!0);function nt(e,t){if(/\(\)|\[\]|\{\}/.test(e.sliceDoc(t-1,t+1)))return{from:t,to:t};let r=v(e).resolveInner(t),n=r.childBefore(t),l=r.childAfter(t),o;return n&&l&&n.to<=t&&l.from>=t&&(o=n.type.prop(G.closedBy))&&o.indexOf(l.name)>-1&&e.doc.lineAt(n.to).from==e.doc.lineAt(l.from).from?{from:n.to,to:l.from}:null}var ot=Se(!1),lt=Se(!0);function Se(e){return({state:t,dispatch:r})=>{if(t.readOnly)return!1;let n=t.changeByRange(l=>{let{from:o,to:c}=l,u=t.doc.lineAt(o),i=!e&&o==c&&nt(t,o);e&&(o=c=(c<=u.to?u:t.doc.lineAt(c)).to);let f=new _(t,{simulateBreak:o,simulateDoubleBreak:!!i}),a=$(f,o);for(a==null&&(a=/^\s*/.exec(t.doc.lineAt(o).text)[0].length);c<u.to&&/\s/.test(u.text[c-u.from]);)c++;i?{from:o,to:c}=i:o>u.from&&o<u.from+100&&!/\S/.test(u.text.slice(0,o))&&(o=u.from);let y=["",x(t,a)];return i&&y.push(x(t,f.lineIndent(u.from,-1))),{changes:{from:o,to:c,insert:q.of(y)},range:s.cursor(o+1+y[1].length)}});return r(t.update(n,{scrollIntoView:!0,userEvent:"input"})),!0}}function N(e,t){let r=-1;return e.changeByRange(n=>{let l=[];for(let c=n.from;c<=n.to;){let u=e.doc.lineAt(c);u.number>r&&(n.empty||n.to>u.from)&&(t(u,l,n),r=u.number),c=u.to+1}let o=e.changes(l);return{changes:l,range:s.range(o.mapPos(n.anchor,1),o.mapPos(n.head,1))}})}var ct=({state:e,dispatch:t})=>{if(e.readOnly)return!1;let r=Object.create(null),n=new _(e,{overrideIndentation:o=>{let c=r[o];return c??-1}}),l=N(e,(o,c,u)=>{let i=$(n,o.from);if(i==null)return;/\S/.test(o.text)||(i=0);let f=/^\s*/.exec(o.text)[0],a=x(e,i);(f!=a||u.from<o.from+f.length)&&(r[o.from]=i,c.push({from:o.from,to:o.from+f.length,insert:a}))});return l.changes.empty||t(e.update(l,{userEvent:"indent"})),!0},W=({state:e,dispatch:t})=>e.readOnly?!1:(t(e.update(N(e,(r,n)=>{n.push({from:r.from,insert:e.facet(Ee)})}),{userEvent:"input.indent"})),!0),be=({state:e,dispatch:t})=>e.readOnly?!1:(t(e.update(N(e,(r,n)=>{let l=/^\s*/.exec(r.text)[0];if(!l)return;let o=j(l,e.tabSize),c=0,u=x(e,Math.max(0,o-V(e)));for(;c<l.length&&c<u.length&&l.charCodeAt(c)==u.charCodeAt(c);)c++;n.push({from:r.from+c,to:r.from+l.length,insert:u.slice(c)})}),{userEvent:"delete.dedent"})),!0),Tt=({state:e,dispatch:t})=>e.selection.ranges.some(r=>!r.empty)?W({state:e,dispatch:t}):(t(e.update(e.replaceSelection("	"),{scrollIntoView:!0,userEvent:"input"})),!0),ut=[{key:"Ctrl-b",run:J,shift:ce,preventDefault:!0},{key:"Ctrl-f",run:Q,shift:ue},{key:"Ctrl-p",run:ee,shift:fe},{key:"Ctrl-n",run:te,shift:ae},{key:"Ctrl-a",run:Ge,shift:Ne},{key:"Ctrl-e",run:Ue,shift:We},{key:"Ctrl-d",run:H},{key:"Ctrl-h",run:z},{key:"Ctrl-k",run:xe},{key:"Ctrl-Alt-h",run:Ae},{key:"Ctrl-o",run:Qe},{key:"Ctrl-t",run:Xe},{key:"Alt-<",run:F},{key:"Alt->",run:w},{key:"Ctrl-v",run:O},{key:"Alt-v",run:U}],it=[{key:"ArrowLeft",run:J,shift:ce,preventDefault:!0},{key:"Mod-ArrowLeft",mac:"Alt-ArrowLeft",run:Te,shift:Fe},{mac:"Cmd-ArrowLeft",run:oe,shift:pe},{key:"ArrowRight",run:Q,shift:ue,preventDefault:!0},{key:"Mod-ArrowRight",mac:"Alt-ArrowRight",run:Ie,shift:we},{mac:"Cmd-ArrowRight",run:ne,shift:ye},{key:"ArrowUp",run:ee,shift:fe,preventDefault:!0},{mac:"Cmd-ArrowUp",run:F,shift:ke},{mac:"Ctrl-ArrowUp",run:U,shift:he},{key:"ArrowDown",run:te,shift:ae,preventDefault:!0},{mac:"Cmd-ArrowDown",run:w,shift:ge},{mac:"Ctrl-ArrowDown",run:O,shift:me},{key:"PageUp",run:U,shift:he},{key:"PageDown",run:O,shift:me},{key:"Home",run:oe,shift:pe},{key:"Mod-Home",run:F,shift:ke},{key:"End",run:ne,shift:ye},{key:"Mod-End",run:w,shift:ge},{key:"Enter",run:ot},{key:"Mod-a",run:Ke},{key:"Backspace",run:z,shift:z},{key:"Delete",run:H,shift:H},{key:"Mod-Backspace",mac:"Alt-Backspace",run:Ae},{key:"Mod-Delete",mac:"Alt-Delete",run:$e},{mac:"Mod-Backspace",run:Je},{mac:"Mod-Delete",run:xe}].concat(ut.map(e=>({mac:e.key,run:e.run,shift:e.shift}))),It=[{key:"Alt-ArrowLeft",mac:"Ctrl-ArrowLeft",run:Ve,shift:ze},{key:"Alt-ArrowRight",mac:"Ctrl-ArrowRight",run:ve,shift:He},{key:"Alt-ArrowUp",run:Ye},{key:"Shift-Alt-ArrowUp",run:et},{key:"Alt-ArrowDown",run:Ze},{key:"Shift-Alt-ArrowDown",run:tt},{key:"Escape",run:_e},{key:"Mod-Enter",run:lt},{key:"Alt-l",mac:"Ctrl-l",run:qe},{key:"Mod-i",run:je,preventDefault:!0},{key:"Mod-[",run:be},{key:"Mod-]",run:W},{key:"Mod-Alt-\\",run:ct},{key:"Shift-Mod-k",run:rt},{key:"Shift-Mod-\\",run:Oe}].concat(it),Pt={key:"Tab",run:W,shift:be};export{tt as copyLineDown,et as copyLineUp,pt as cursorCharBackward,yt as cursorCharForward,J as cursorCharLeft,Q as cursorCharRight,w as cursorDocEnd,F as cursorDocStart,gt as cursorGroupBackward,kt as cursorGroupForward,Te as cursorGroupLeft,Ie as cursorGroupRight,oe as cursorLineBoundaryBackward,ne as cursorLineBoundaryForward,te as cursorLineDown,Ue as cursorLineEnd,Ge as cursorLineStart,ee as cursorLineUp,Oe as cursorMatchingBracket,O as cursorPageDown,U as cursorPageUp,Lt as cursorSubwordBackward,Bt as cursorSubwordForward,Ve as cursorSyntaxLeft,ve as cursorSyntaxRight,It as defaultKeymap,z as deleteCharBackward,H as deleteCharForward,Ae as deleteGroupBackward,$e as deleteGroupForward,rt as deleteLine,xe as deleteToLineEnd,Je as deleteToLineStart,Rt as deleteTrailingWhitespace,ut as emacsStyleKeymap,be as indentLess,W as indentMore,ct as indentSelection,Pt as indentWithTab,lt as insertBlankLine,Et as insertNewline,ot as insertNewlineAndIndent,Tt as insertTab,Ze as moveLineDown,Ye as moveLineUp,Ke as selectAll,Ct as selectCharBackward,xt as selectCharForward,ce as selectCharLeft,ue as selectCharRight,ge as selectDocEnd,ke as selectDocStart,St as selectGroupBackward,Dt as selectGroupForward,Fe as selectGroupLeft,we as selectGroupRight,qe as selectLine,pe as selectLineBoundaryBackward,ye as selectLineBoundaryForward,ae as selectLineDown,We as selectLineEnd,Ne as selectLineStart,fe as selectLineUp,At as selectMatchingBracket,me as selectPageDown,he as selectPageUp,je as selectParentSyntax,Mt as selectSubwordBackward,bt as selectSubwordForward,ze as selectSyntaxLeft,He as selectSyntaxRight,_e as simplifySelection,Qe as splitLine,it as standardKeymap,Xe as transposeChars};