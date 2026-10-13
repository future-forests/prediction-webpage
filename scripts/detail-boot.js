// Standalone detail preview — details/page.html?id={id}

function bindStandaloneDetailLinks(container){
  if(!container) return;
  container.addEventListener('click',function(e){
    var link=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!link) return;
    var hash=link.getAttribute('href');
    if(!hash||hash==='#') return;
    if(hash.indexOf('#fn')===0||hash.indexOf('#fnref')===0) return;
    e.preventDefault();
    window.location.href='../basis.html'+hash;
  });
}

function mountDetailPage(){
  var params=new URLSearchParams(window.location.search);
  var id=params.get('id');
  if(!id) return;

  Promise.all([loadPageContent('../webpage.html'), loadDetail(id)]).then(function(results){
    window.OUTLINE_BY_ID=(parseContent(results[0]).outlineById)||{};
    var raw=results[1];
    if(isDetailPlaceholder(raw)){
      document.body.innerHTML='<p style="color:var(--ink-muted);font-style:italic">No detail content found for <code>'+id+'</code>.</p>';
      return;
    }
    var title=mountDetail({ id:id, raw:raw, target:document.body, fallbackTitle:id });
    if(title) document.title=title;
    bindStandaloneDetailLinks(document.body);
  }).catch(function(err){
    console.error(err);
    document.body.innerHTML='<p style="color:var(--ink-muted);font-style:italic">Could not load page data.</p>';
  });
}

document.addEventListener('DOMContentLoaded',mountDetailPage);
