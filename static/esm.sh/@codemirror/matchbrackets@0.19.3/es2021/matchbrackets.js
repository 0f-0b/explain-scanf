import{Facet as M,combineConfig as T,StateField as O}from"../../state@0.19.3/es2021/state.js";import{syntaxTree as P}from"../../language@0.19.3/es2021/language.js";import{EditorView as y,Decoration as h}from"../../view@0.19.12/es2021/view.js";import{NodeProp as B}from"../../../@lezer/common@0.15.7/es2021/common.js";var w=y.baseTheme({".cm-matchingBracket":{backgroundColor:"#328c8252"},".cm-nonmatchingBracket":{backgroundColor:"#bb555544"}}),D=1e4,v="()[]{}",C=M.define({combine(r){return T(r,{afterCursor:!0,brackets:v,maxScanDistance:D})}}),F=h.mark({class:"cm-matchingBracket"}),N=h.mark({class:"cm-nonmatchingBracket"}),_=O.define({create(){return h.none},update(r,t){if(!t.docChanged&&!t.selection)return r;let e=[],a=t.state.facet(C);for(let o of t.state.selection.ranges){if(!o.empty)continue;let c=d(t.state,o.head,-1,a)||o.head>0&&d(t.state,o.head-1,1,a)||a.afterCursor&&(d(t.state,o.head,1,a)||o.head<t.state.doc.length&&d(t.state,o.head+1,-1,a));if(!c)continue;let i=c.matched?F:N;e.push(i.range(c.start.from,c.start.to)),c.end&&e.push(i.range(c.end.from,c.end.to))}return h.set(e,!0)},provide:r=>y.decorations.from(r)}),q=[_,w];function V(r={}){return[C.of(r),q]}function x(r,t,e){let a=r.prop(t<0?B.openedBy:B.closedBy);if(a)return a;if(r.name.length==1){let o=e.indexOf(r.name);if(o>-1&&o%2==(t<0?1:0))return[e[o+t]]}return null}function d(r,t,e,a={}){let o=a.maxScanDistance||D,c=a.brackets||v,i=P(r),l=i.resolveInner(t,e);for(let f=l;f;f=f.parent){let n=x(f.type,e,c);if(n&&f.from<f.to)return z(r,t,e,f,n,c)}return A(r,t,e,i,l.type,o,c)}function z(r,t,e,a,o,c){let i=a.parent,l={from:a.from,to:a.to},f=0,n=i==null?void 0:i.cursor;if(n&&(e<0?n.childBefore(a.from):n.childAfter(a.to)))do if(e<0?n.to<=a.from:n.from>=a.to){if(f==0&&o.indexOf(n.type.name)>-1&&n.from<n.to)return{start:l,end:{from:n.from,to:n.to},matched:!0};if(x(n.type,e,c))f++;else if(x(n.type,-e,c)&&(f--,f==0))return{start:l,end:n.from==n.to?void 0:{from:n.from,to:n.to},matched:!1}}while(e<0?n.prevSibling():n.nextSibling());return{start:l,matched:!1}}function A(r,t,e,a,o,c,i){let l=e<0?r.sliceDoc(t-1,t):r.sliceDoc(t,t+1),f=i.indexOf(l);if(f<0||f%2==0!=e>0)return null;let n={from:e<0?t-1:t,to:e>0?t+1:t},g=r.doc.iterRange(t,e>0?r.doc.length:0),p=0;for(let u=0;!g.next().done&&u<=c;){let s=g.value;e<0&&(u+=s.length);let b=t+u*e;for(let m=e>0?0:s.length-1,S=e>0?s.length:-1;m!=S;m+=e){let k=i.indexOf(s[m]);if(!(k<0||a.resolve(b+m,1).type!=o))if(k%2==0==e>0)p++;else{if(p==1)return{start:n,end:{from:b+m,to:b+m+1},matched:k>>1==f>>1};p--}}e>0&&(u+=s.length)}return g.done?{start:n,matched:!1}:null}export{V as bracketMatching,d as matchBrackets};