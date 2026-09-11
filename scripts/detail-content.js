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

function mountDetail(options){
  if(!options||!options.target||typeof renderDetailMarkdown!=='function') return '';
  var displayTitle=options.fallbackTitle||'';
  options.target.innerHTML=renderDetailMarkdown(options.raw||'');
  hydrateDetailContent(options.target);
  return displayTitle;
}
