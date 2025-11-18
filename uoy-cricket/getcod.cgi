<!--
function cCk(nm,vl,mn){var ex="";if (mn) {var d=new Date();d.setTime(d.getTime()+(mn*18*1000)); ex="; expires="+d.toGMTString();} document.cookie=nm+"="+vl+ex+"; path=/";}
function rCk(nm){var nEQ=nm+"=";var ca=document.cookie.split(';');for(var i=0;i<ca.length;i++){var c=ca[i]; while(c.charAt(0)==' ') c=c.substring(1,c.length); if(c.indexOf(nEQ) == 0) return c.substring(nEQ.length,c.length);}return null;}
function ud(){var u=""+o_.getTime();return(u);}
us_="amancalllednorm",n_=c_="";l_=""+screen.width;d_=document.referrer;var o_=new Date();vu_="&VUT=-1";
if (self != top){try {r_=""+escape(parent.document.referrer);}catch(e_r) {r_=""+escape(d_);}}
else {r_=""+escape(d_);}
if(navigator.appName!="Netscape"){c_=screen.colorDepth}
else{c_=screen.pixelDepth}
if (sv_ = rCk("SV_"+us_)){vu_="&VUT="+(o_.getTime()-parseInt(sv_,10));cCk("SV_"+us_,ud());}
else cCk("SV_"+us_,ud());
if (!rCk("SN_"+us_)){n_="&NUT=y";cCk("SN_"+us_,"0",2592000);}
else cCk("SN_"+us_,"0",2592000);
document.write("<a href=\"http://s1.shinystat.com/cgi-bin/shinystatv.cgi?USER="+us_+"&NH=1\" Target=\"_new\"><img src=\"http://s1.shinystat.com/cgi-bin/shinystat.cgi?USER="+us_+"&REFER="+r_+"&COLOR="+c_+"&SIZE="+l_+vu_+n_+"\" border=\"0\"></a>");
// -->
