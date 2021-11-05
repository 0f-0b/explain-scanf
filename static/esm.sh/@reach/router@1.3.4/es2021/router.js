import l,{useContext as j}from"../../../react@17.0.2/es2021/react.js";import"../../../prop-types@15.7.2/es2021/prop-types.js";import Y from"../../../invariant@2.2.4/es2021/invariant.js";import Ot from"../../../create-react-context@0.3.0/es2021/create-react-context.js";import{polyfill as Tt}from"../../../react-lifecycles-compat@3.0.4/es2021/react-lifecycles-compat.js";import ht from"../../../invariant@2.2.4/es2021/invariant.js";var k=function(t,r){return t.substr(0,r.length)===r},V=function(t,r){for(var e=void 0,n=void 0,a=r.split("?"),u=a[0],i=R(u),s=i[0]==="",c=Et(t),p=0,f=c.length;p<f;p++){var v=!1,h=c[p].route;if(h.default){n={route:h,params:{},uri:r};continue}for(var d=R(h.path),m={},w=Math.max(i.length,d.length),g=0;g<w;g++){var b=d[g],P=i[g];if(nt(b)){var D=b.slice(1)||"*";m[D]=i.slice(g).map(decodeURIComponent).join("/");break}if(P===void 0){v=!0;break}var E=K.exec(b);if(E&&!s){var T=wt.indexOf(E[1])===-1;T||ht(!1);var N=decodeURIComponent(P);m[E[1]]=N}else if(b!==P){v=!0;break}}if(!v){e={route:h,params:m,uri:"/"+i.slice(0,g).join("/")};break}}return e||n||null},F=function(t,r){return V([{path:t}],r)},C=function(t,r){if(k(t,"/"))return t;var e=t.split("?"),n=e[0],a=e[1],u=r.split("?"),i=u[0],s=R(n),c=R(i);if(s[0]==="")return M(i,a);if(!k(s[0],".")){var p=c.concat(s).join("/");return M((i==="/"?"":"/")+p,a)}for(var f=c.concat(s),v=[],h=0,d=f.length;h<d;h++){var m=f[h];m===".."?v.pop():m!=="."&&v.push(m)}return M("/"+v.join("/"),a)},W=function(t,r){var e=t.split("?"),n=e[0],a=e[1],u=a===void 0?"":a,i=R(n),s="/"+i.map(function(h){var d=K.exec(h);return d?r[d[1]]:h}).join("/"),c=r.location;c=c===void 0?{}:c;var p=c.search,f=p===void 0?"":p,v=f.split("?")[1]||"";return s=M(s,u,v),s},tt=function(t,r){var e=function(i){return rt(i)},n=R(t).filter(e).sort().join("/"),a=R(r).filter(e).sort().join("/");return n===a},K=/^:(.+)/,et=4,dt=3,mt=2,gt=1,yt=1,bt=function(t){return t===""},rt=function(t){return K.test(t)},nt=function(t){return t&&t[0]==="*"},Pt=function(t,r){var e=t.default?0:R(t.path).reduce(function(n,a){return n+=et,bt(a)?n+=yt:rt(a)?n+=mt:nt(a)?n-=et+gt:n+=dt,n},0);return{route:t,score:e,index:r}},Et=function(t){return t.map(Pt).sort(function(r,e){return r.score<e.score?1:r.score>e.score?-1:r.index-e.index})},R=function(t){return t.replace(/(^\/+|\/+$)/g,"").split("/")},M=function(t){for(var r=arguments.length,e=Array(r>1?r-1:0),n=1;n<r;n++)e[n-1]=arguments[n];return e=e.filter(function(a){return a&&a.length>0}),t+(e&&e.length>0?"?"+e.join("&"):"")},wt=["uri","path"],ot=function(t,r){var e=Object.keys(t);return e.length===Object.keys(r).length&&e.every(function(n){return r.hasOwnProperty(n)&&t[n]===r[n]})};var Rt=Object.assign||function(o){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var e in r)Object.prototype.hasOwnProperty.call(r,e)&&(o[e]=r[e])}return o},B=function(t){var r=t.location,e=r.search,n=r.hash,a=r.href,u=r.origin,i=r.protocol,s=r.host,c=r.hostname,p=r.port,f=t.location.pathname;if(!f&&a&&st){var v=new URL(a);f=v.pathname}return{pathname:encodeURI(decodeURI(f)),search:e,hash:n,href:a,origin:u,protocol:i,host:s,hostname:c,port:p,state:t.history.state,key:t.history.state&&t.history.state.key||"initial"}},at=function(t,r){var e=[],n=B(t),a=!1,u=function(){};return{get location(){return n},get transitioning(){return a},_onTransitionComplete:function(){a=!1,u()},listen:function(s){e.push(s);var c=function(){n=B(t),s({location:n,action:"POP"})};return t.addEventListener("popstate",c),function(){t.removeEventListener("popstate",c),e=e.filter(function(p){return p!==s})}},navigate:function(s){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},p=c.state,f=c.replace,v=f===void 0?!1:f;if(typeof s=="number")t.history.go(s);else{p=Rt({},p,{key:Date.now()+""});try{a||v?t.history.replaceState(p,null,s):t.history.pushState(p,null,s)}catch{t.location[v?"replace":"assign"](s)}}n=B(t),a=!0;var h=new Promise(function(d){return u=d});return e.forEach(function(d){return d({location:n,action:"PUSH"})}),h}}},it=function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:"/",r=t.indexOf("?"),e={pathname:r>-1?t.substr(0,r):t,search:r>-1?t.substr(r):""},n=0,a=[e],u=[null];return{get location(){return a[n]},addEventListener:function(s,c){},removeEventListener:function(s,c){},history:{get entries(){return a},get index(){return n},get state(){return u[n]},pushState:function(s,c,p){var f=p.split("?"),v=f[0],h=f[1],d=h===void 0?"":h;n++,a.push({pathname:v,search:d.length?"?"+d:d}),u.push(s)},replaceState:function(s,c,p){var f=p.split("?"),v=f[0],h=f[1],d=h===void 0?"":h;a[n]={pathname:v,search:d},u[n]=s},go:function(s){var c=n+s;c<0||c>u.length-1||(n=c)}}}},st=!!(typeof window!="undefined"&&window.document&&window.document.createElement),xt=function(){return st?window:it()},Q=at(xt()),Ct=Q.navigate;var y=Object.assign||function(o){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var e in r)Object.prototype.hasOwnProperty.call(r,e)&&(o[e]=r[e])}return o};function x(o,t){var r={};for(var e in o)t.indexOf(e)>=0||!Object.prototype.hasOwnProperty.call(o,e)||(r[e]=o[e]);return r}function I(o,t){if(!(o instanceof t))throw new TypeError("Cannot call a class as a function")}function L(o,t){if(!o)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t&&(typeof t=="object"||typeof t=="function")?t:o}function $(o,t){if(typeof t!="function"&&t!==null)throw new TypeError("Super expression must either be null or a function, not "+typeof t);o.prototype=Object.create(t&&t.prototype,{constructor:{value:o,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(o,t):o.__proto__=t)}var z=function(t,r){var e=Ot(r);return e.displayName=t,e},S=z("Location"),U=function(t){var r=t.children;return l.createElement(S.Consumer,null,function(e){return e?r(e):l.createElement(ut,null,r)})},ut=function(o){$(t,o);function t(){var r,e,n;I(this,t);for(var a=arguments.length,u=Array(a),i=0;i<a;i++)u[i]=arguments[i];return n=(r=(e=L(this,o.call.apply(o,[this].concat(u))),e),e.state={context:e.getContext(),refs:{unlisten:null}},r),L(e,n)}return t.prototype.getContext=function(){var e=this.props.history,n=e.navigate,a=e.location;return{navigate:n,location:a}},t.prototype.componentDidCatch=function(e,n){if(Dt(e)){var a=this.props.history.navigate;a(e.uri,{replace:!0})}else throw e},t.prototype.componentDidUpdate=function(e,n){n.context.location!==this.state.context.location&&this.props.history._onTransitionComplete()},t.prototype.componentDidMount=function(){var e=this,n=this.state.refs,a=this.props.history;a._onTransitionComplete(),n.unlisten=a.listen(function(){Promise.resolve().then(function(){requestAnimationFrame(function(){e.unmounted||e.setState(function(){return{context:e.getContext()}})})})})},t.prototype.componentWillUnmount=function(){var e=this.state.refs;this.unmounted=!0,e.unlisten()},t.prototype.render=function(){var e=this.state.context,n=this.props.children;return l.createElement(S.Provider,{value:e},typeof n=="function"?n(e):n||null)},t}(l.Component);ut.defaultProps={history:Q};var Yt=function(t){var r=t.url,e=t.children,n=r.indexOf("?"),a=n>-1,u=void 0,i="",s="";return a?(u=r.substring(0,n),i=r.substring(n)):u=r,l.createElement(S.Provider,{value:{location:{pathname:u,search:i,hash:s},navigate:function(){throw new Error("You can't call navigate on the server.")}}},e)},O=z("Base",{baseuri:"/",basepath:"/"}),Nt=function(t){return l.createElement(O.Consumer,null,function(r){return l.createElement(U,null,function(e){return l.createElement(ct,y({},r,e,t))})})},ct=function(o){$(t,o);function t(){return I(this,t),L(this,o.apply(this,arguments))}return t.prototype.render=function(){var e=this.props,n=e.location,a=e.navigate,u=e.basepath,i=e.primary,s=e.children,c=e.baseuri,p=e.component,f=p===void 0?"div":p,v=x(e,["location","navigate","basepath","primary","children","baseuri","component"]),h=l.Children.toArray(s).reduce(function(q,_){var A=Mt(u)(_);return q.concat(A)},[]),d=n.pathname,m=V(h,d);if(m){var w=m.params,g=m.uri,b=m.route,P=m.route.value;u=b.default?u:b.path.replace(/\*$/,"");var D=y({},w,{uri:g,location:n,navigate:function(_,A){return a(C(_,g),A)}}),E=l.cloneElement(P,D,P.props.children?l.createElement(Nt,{location:n,primary:i},P.props.children):void 0),T=i?Lt:f,N=i?y({uri:g,location:n,component:f},v):v;return l.createElement(O.Provider,{value:{baseuri:g,basepath:u}},l.createElement(T,N,E))}else return null},t}(l.PureComponent);ct.defaultProps={primary:!0};var pt=z("Focus"),Lt=function(t){var r=t.uri,e=t.location,n=t.component,a=x(t,["uri","location","component"]);return l.createElement(pt.Consumer,null,function(u){return l.createElement(lt,y({},a,{component:n,requestFocus:u,uri:r,location:e}))})},G=!0,J=0,lt=function(o){$(t,o);function t(){var r,e,n;I(this,t);for(var a=arguments.length,u=Array(a),i=0;i<a;i++)u[i]=arguments[i];return n=(r=(e=L(this,o.call.apply(o,[this].concat(u))),e),e.state={},e.requestFocus=function(s){!e.state.shouldFocus&&s&&s.focus()},r),L(e,n)}return t.getDerivedStateFromProps=function(e,n){var a=n.uri==null;if(a)return y({shouldFocus:!0},e);var u=e.uri!==n.uri,i=n.location.pathname!==e.location.pathname&&e.location.pathname===e.uri;return y({shouldFocus:u||i},e)},t.prototype.componentDidMount=function(){J++,this.focus()},t.prototype.componentWillUnmount=function(){J--,J===0&&(G=!0)},t.prototype.componentDidUpdate=function(e,n){e.location!==this.props.location&&this.state.shouldFocus&&this.focus()},t.prototype.focus=function(){var e=this.props.requestFocus;e?e(this.node):G?G=!1:this.node&&(this.node.contains(document.activeElement)||this.node.focus())},t.prototype.render=function(){var e=this,n=this.props,a=n.children,u=n.style,i=n.requestFocus,s=n.component,c=s===void 0?"div":s,p=n.uri,f=n.location,v=x(n,["children","style","requestFocus","component","uri","location"]);return l.createElement(c,y({style:y({outline:"none"},u),tabIndex:"-1",ref:function(d){return e.node=d}},v),l.createElement(pt.Provider,{value:this.requestFocus},this.props.children))},t}(l.Component);Tt(lt);var _t=function(){},X=l.forwardRef;typeof X=="undefined"&&(X=function(t){return t});var St=X(function(o,t){var r=o.innerRef,e=x(o,["innerRef"]);return l.createElement(O.Consumer,null,function(n){var a=n.basepath,u=n.baseuri;return l.createElement(U,null,function(i){var s=i.location,c=i.navigate,p=e.to,f=e.state,v=e.replace,h=e.getProps,d=h===void 0?_t:h,m=x(e,["to","state","replace","getProps"]),w=C(p,u),g=encodeURI(w),b=s.pathname===g,P=k(s.pathname,g);return l.createElement("a",y({ref:t||r,"aria-current":b?"page":void 0},m,d({isCurrent:b,isPartiallyCurrent:P,href:w,location:s}),{href:w,onClick:function(E){if(m.onClick&&m.onClick(E),It(E)){E.preventDefault();var T=v;if(typeof v!="boolean"&&b){var N=y({},s.state),q=N.key,_=x(N,["key"]);T=ot(y({},f),_)}c(w,{state:f,replace:T})}}}))})})});St.displayName="Link";function ft(o){this.uri=o}var Dt=function(t){return t instanceof ft},kt=function(t){throw new ft(t)},Ft=function(o){$(t,o);function t(){return I(this,t),L(this,o.apply(this,arguments))}return t.prototype.componentDidMount=function(){var e=this.props,n=e.navigate,a=e.to,u=e.from,i=e.replace,s=i===void 0?!0:i,c=e.state,p=e.noThrow,f=e.baseuri,v=x(e,["navigate","to","from","replace","state","noThrow","baseuri"]);Promise.resolve().then(function(){var h=C(a,f);n(W(h,v),{replace:s,state:c})})},t.prototype.render=function(){var e=this.props,n=e.navigate,a=e.to,u=e.from,i=e.replace,s=e.state,c=e.noThrow,p=e.baseuri,f=x(e,["navigate","to","from","replace","state","noThrow","baseuri"]),v=C(a,p);return c||kt(W(v,f)),null},t}(l.Component),H=function(t){return l.createElement(O.Consumer,null,function(r){var e=r.baseuri;return l.createElement(U,null,function(n){return l.createElement(Ft,y({},n,{baseuri:e},t))})})},zt=function(t){var r=t.path,e=t.children;return l.createElement(O.Consumer,null,function(n){var a=n.baseuri;return l.createElement(U,null,function(u){var i=u.navigate,s=u.location,c=C(r,a),p=F(c,s.pathname);return e({navigate:i,location:s,match:p?y({},p.params,{uri:p.uri,path:r}):null})})})},vt=function(){var t=j(S);if(!t)throw new Error("useLocation hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");return t.location},Gt=function(){var t=j(S);if(!t)throw new Error("useNavigate hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");return t.navigate},Jt=function(){var t=j(O);if(!t)throw new Error("useParams hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");var r=vt(),e=F(t.basepath,r.pathname);return e?e.params:null},Xt=function(t){if(!t)throw new Error("useMatch(path: string) requires an argument of a string to match against");var r=j(O);if(!r)throw new Error("useMatch hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");var e=vt(),n=C(t,r.baseuri),a=F(n,e.pathname);return a?y({},a.params,{uri:a.uri,path:t}):null},Z=function(t){return t.replace(/(^\/+|\/+$)/g,"")},Mt=function o(t){return function(r){if(!r)return null;if(r.type===l.Fragment&&r.props.children)return l.Children.map(r.props.children,o(t));if(r.props.path||r.props.default||r.type===H||Y(!1),r.type===H&&(!r.props.from||!r.props.to)&&Y(!1),r.type===H&&!tt(r.props.from,r.props.to)&&Y(!1),r.props.default)return{value:r,default:!0};var e=r.type===H?r.props.from:r.props.path,n=e==="/"?t:Z(t)+"/"+Z(e);return{value:r,default:r.props.default,path:r.props.children?Z(n)+"/*":n}}},It=function(t){return!t.defaultPrevented&&t.button===0&&!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)};export{St as Link,U as Location,ut as LocationProvider,zt as Match,H as Redirect,Nt as Router,Yt as ServerLocation,at as createHistory,it as createMemorySource,Q as globalHistory,Dt as isRedirect,F as matchPath,Ct as navigate,kt as redirectTo,vt as useLocation,Xt as useMatch,Gt as useNavigate,Jt as useParams};