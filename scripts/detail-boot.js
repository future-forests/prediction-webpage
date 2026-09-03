// Standalone detail preview — details/page.html?id={id}
function mountDetailPage(){
  var params=new URLSearchParams(window.location.search);
  var id=params.get('id');
  if(!id) return;

  loadDetail(id).then(function(raw){
    if(isDetailPlaceholder(raw)){
      document.body.innerHTML='<p style="color:var(--ink-muted);font-style:italic">No detail content found for <code>'+id+'</code>.</p>';
      return;
    }
    var title=mountDetail({
      raw:raw,
      target:document.body,
      fallbackTitle:id
    });
    if(title) document.title=title;
  });
}

document.addEventListener('DOMContentLoaded',mountDetailPage);
