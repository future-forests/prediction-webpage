// Detail .md files — load, Markdown render, citations, MathJax (overlay + page.html).

var DETAIL_MATH_TOKEN='DETAILMATHBLOCK';
var detailMdInstance=null;

function escapeAttr(value){
  return String(value)
    .replace(/&/g,'&amp;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function protectDetailMath(text){
  var blocks=[];
  var out=text
    .replace(/\\\[([\s\S]*?)\\\]/g,function(match){
      blocks.push(match);
      return DETAIL_MATH_TOKEN+(blocks.length-1)+DETAIL_MATH_TOKEN;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g,function(match){
      blocks.push(match);
      return DETAIL_MATH_TOKEN+(blocks.length-1)+DETAIL_MATH_TOKEN;
    });
  return { text:out, blocks:blocks };
}

function restoreDetailMath(html, blocks){
  if(!blocks.length) return html;
  return html.replace(new RegExp(DETAIL_MATH_TOKEN+'(\\d+)'+(DETAIL_MATH_TOKEN),'g'),function(_, index){
    return blocks[parseInt(index,10)]||'';
  });
}

function getDetailMarkdown(){
  if(detailMdInstance) return detailMdInstance;
  if(typeof markdownit!=='function') return null;

  var md=markdownit({ html:true, linkify:true, typographer:false });
  if(typeof markdownitFootnote==='function') md.use(markdownitFootnote);

  var defaultLinkOpen=md.renderer.rules.link_open||function(tokens, idx, options, env, self){
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_open=function(tokens, idx, options, env, self){
    var href=tokens[idx].attrGet('href');
    if(href&&href.charAt(0)!=='#'){
      tokens[idx].attrSet('target','_blank');
      tokens[idx].attrSet('rel','noopener noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  detailMdInstance=md;
  return md;
}

function renderDetailMarkdown(raw){
  var md=getDetailMarkdown();
  if(!md) return '<p style="color:var(--ink-muted);font-style:italic">Markdown renderer failed to load.</p>';
  var text=raw==null?'':String(raw);
  var cited=text.replace(/\[@([^\]]+)\]/g,function(_, key){
    return '<sup class="cite-ref" data-cite="'+escapeAttr(key.trim())+'"></sup>';
  });
  var math=protectDetailMath(cited);
  return restoreDetailMath(md.render(math.text), math.blocks);
}

function getDetailContentPath(id){
  var base=typeof window.DETAIL_CONTENT_BASE==='string'?window.DETAIL_CONTENT_BASE:'details/';
  return base+id+'.md';
}

function isDetailPlaceholder(raw){
  return !String(raw==null?'':raw).replace(/\s+/g,' ').trim();
}

function loadDetail(id){
  return fetch(getDetailContentPath(id)).then(function(res){
    if(!res.ok) return '';
    return res.text();
  }).catch(function(){ return ''; });
}

function typesetDetailMath(root){
  if(!root||!window.MathJax||!window.MathJax.typesetPromise) return;
  var run=function(){ window.MathJax.typesetPromise([root]); };
  if(window.MathJax.startup&&window.MathJax.startup.promise) window.MathJax.startup.promise.then(run);
  else run();
}

function hydrateDetailContent(root){
  if(!root) return;
  if(window.CitationTools){
    window.CitationTools.hydrate({
      root:root,
      biblioGlobal:'BASIS_BIBLIO',
      citationSelector:'.cite-ref[data-cite]',
      footnoteSupSelector:false,
      missingPrefix:'Reference details not found in central bibliography for '
    });
  }
  typesetDetailMath(root);
}

function numberDetailHeadings(root, base){
  if(!root||!base) return;
  var h2=0, h3=0, b=0;
  function mark(host, num){
    var sp=document.createElement('span');
    sp.className='outline-num';
    sp.textContent=num;
    host.insertBefore(sp, host.firstChild);
    host.insertBefore(document.createTextNode(' '), sp.nextSibling);
  }
  var nodes=root.querySelectorAll('h2,h3,p');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i];
    if(el.tagName==='H2'){ h2++; h3=0; b=0; mark(el, base+'.'+h2); }
    else if(el.tagName==='H3'){ h3++; b=0; mark(el, base+'.'+h2+'.'+h3); }
    else if(h2&&h3&&el.firstElementChild&&el.firstElementChild.tagName==='STRONG'){
      b++; mark(el.firstElementChild, base+'.'+h2+'.'+h3+'.'+b);
    }
  }
}

function mountDetail(options){
  if(!options||!options.target||typeof renderDetailMarkdown!=='function') return '';
  var displayTitle=options.fallbackTitle||'';
  var detailId=options.id||'';
  var base=detailId&&window.OUTLINE_BY_ID?window.OUTLINE_BY_ID[detailId]:'';
  options.target.innerHTML=renderDetailMarkdown(options.raw||'');
  if(base){
    if(typeof phaseAccentFromOutline==='function'){
      options.target.style.setProperty('--phase-accent', phaseAccentFromOutline(base));
    }
    numberDetailHeadings(options.target, base);
  }
  hydrateDetailContent(options.target);
  if(base&&displayTitle){
    displayTitle=base+' '+displayTitle.replace(/^\d+(?:\.\d+)*\s+/, '').trim();
  }
  return displayTitle;
}
