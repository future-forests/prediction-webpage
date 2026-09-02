// Render detail page content from <script type="text/content" id="page-content">.
function mountDetailPage(){
  var el=document.getElementById('page-content');
  if(!el||typeof renderDetailContent!=='function') return;
  var html=renderDetailContent(el.textContent);
  document.body.innerHTML=html;

  if(window.CitationTools){
    window.CitationTools.hydrate({
      biblioGlobal:'BASIS_BIBLIO',
      citationSelector:'.cite-ref[data-cite]',
      footnoteSupSelector:'.footnote-ref',
      footnoteLabelSelector:'.footnote-label',
      missingPrefix:'Reference details not found in central bibliography for '
    });
  }

  if(window.MathJax&&window.MathJax.typesetPromise){
    window.MathJax.typesetPromise([document.body]);
  }
}

document.addEventListener('DOMContentLoaded',mountDetailPage);
