// Shared helpers for detail .txt files (overlay + standalone page.html).

function getDetailContentPath(id){
  var base=typeof window.DETAIL_CONTENT_BASE==='string'?window.DETAIL_CONTENT_BASE:'details/';
  return base+id+'.txt';
}

function parseDetailRaw(raw){
  var text=raw==null?'':String(raw);
  var lines=text.split('\n');
  var title='';
  var start=0;
  if(lines.length&&/^TITLE:\s*/i.test(lines[0])){
    title=lines[0].replace(/^TITLE:\s*/i,'').trim();
    start=1;
    while(start<lines.length&&lines[start].trim()==='') start++;
  }
  var body=lines.slice(start).join('\n');
  return { title:title, body:body };
}

function isDetailPlaceholder(raw){
  var parsed=parseDetailRaw(raw);
  return !parsed.body.replace(/\s+/g,' ').trim();
}

function loadDetail(id){
  return fetch(getDetailContentPath(id)).then(function(res){
    if(!res.ok) return '';
    return res.text();
  }).catch(function(){ return ''; });
}

function hydrateDetailContent(root){
  if(!root) return;
  if(window.CitationTools){
    window.CitationTools.hydrate({
      root:root,
      biblioGlobal:'BASIS_BIBLIO',
      citationSelector:'.cite-ref[data-cite]',
      footnoteSupSelector:'.footnote-ref',
      footnoteLabelSelector:'.footnote-label',
      missingPrefix:'Reference details not found in central bibliography for '
    });
  }
  if(window.MathJax&&window.MathJax.typesetPromise){
    window.MathJax.typesetPromise([root]);
  }
}

function mountDetail(options){
  if(!options||!options.target||typeof renderDetailContent!=='function') return '';
  var parsed=parseDetailRaw(options.raw||'');
  var displayTitle=parsed.title||options.fallbackTitle||'';
  options.target.innerHTML=renderDetailContent(parsed.body);
  hydrateDetailContent(options.target);
  return displayTitle;
}
