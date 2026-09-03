// Detail page overlay — content lives at details/{id}.txt, matching each #id in basis.html.

function hidePlaceholderDetailButtons(){
  var buttons=document.querySelectorAll('.more-details-btn[data-detail-id]');
  var seen={};
  for(var i=0;i<buttons.length;i++){
    (function(id){
      if(!id||seen[id]) return;
      seen[id]=true;
      loadDetail(id).then(function(raw){
        if(!isDetailPlaceholder(raw)) return;
        var matches=document.querySelectorAll('.more-details-btn[data-detail-id="'+id+'"]');
        for(var j=0;j<matches.length;j++){
          var row=matches[j].closest('.details-row');
          if(row) row.hidden=true;
          else matches[j].hidden=true;
        }
      });
    })(buttons[i].getAttribute('data-detail-id'));
  }
}

function handleDetailOverlayEscape(e){
  if(e.key!=='Escape') return;
  var dialog=document.getElementById('detail-overlay');
  if(!dialog||!dialog.open) return;
  e.preventDefault();
  closeDetailOverlay();
}

function bindDetailOverlayLinks(container){
  if(!container) return;
  container.addEventListener('click',function(e){
    var link=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!link) return;
    var hash=link.getAttribute('href');
    if(!hash||hash==='#') return;
    var target=document.querySelector(hash);
    if(!target) return;
    e.preventDefault();
    if(container.contains(target)){
      target.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
    closeDetailOverlay();
    target.scrollIntoView({ behavior:'smooth', block:'start' });
    if(typeof revealCollapsedForSearch==='function') revealCollapsedForSearch(target);
  });
}

function openDetailOverlay(id, fallbackTitle){
  var dialog=document.getElementById('detail-overlay');
  var bodyEl=document.getElementById('detail-overlay-body');
  var titleEl=document.getElementById('detail-overlay-title');
  if(!dialog||!bodyEl){
    window.location.href='details/page.html?id='+encodeURIComponent(id);
    return;
  }

  bodyEl.innerHTML='<p style="color:var(--ink-muted);font-style:italic">Loading…</p>';
  if(titleEl) titleEl.textContent='More details: '+(fallbackTitle||'');
  document.body.classList.add('detail-overlay-open');

  if(typeof dialog.showModal==='function') dialog.showModal();
  else dialog.setAttribute('open','open');

  loadDetail(id).then(function(raw){
    if(isDetailPlaceholder(raw)){
      bodyEl.innerHTML='<p style="color:var(--ink-muted);font-style:italic">No detail content available yet.</p>';
      return;
    }
    var title=mountDetail({
      raw:raw,
      target:bodyEl,
      fallbackTitle:fallbackTitle
    });
    if(titleEl&&title) titleEl.textContent='More details: '+title;
  });
}

function closeDetailOverlay(){
  var dialog=document.getElementById('detail-overlay');
  var bodyEl=document.getElementById('detail-overlay-body');
  if(bodyEl) bodyEl.innerHTML='';
  if(dialog&&dialog.open){
    dialog.close();
  }else if(dialog){
    dialog.removeAttribute('open');
  }
  document.body.classList.remove('detail-overlay-open');
}

document.addEventListener('keydown',handleDetailOverlayEscape);

document.addEventListener('DOMContentLoaded',function(){
  var bodyEl=document.getElementById('detail-overlay-body');
  if(bodyEl) bindDetailOverlayLinks(bodyEl);
  var dialog=document.getElementById('detail-overlay');
  if(dialog){
    dialog.addEventListener('click',function(e){
      if(e.target===dialog) closeDetailOverlay();
    });
    dialog.addEventListener('close',function(){
      document.body.classList.remove('detail-overlay-open');
      var bodyEl=document.getElementById('detail-overlay-body');
      if(bodyEl) bodyEl.innerHTML='';
    });
    dialog.addEventListener('cancel',function(e){
      e.preventDefault();
      closeDetailOverlay();
    });
  }
  document.addEventListener('basis-rendered',function(){
    hidePlaceholderDetailButtons();
  });
});

document.addEventListener('click',function(e){
  var btn=e.target.closest&&e.target.closest('.more-details-btn[data-detail-id]');
  if(!btn) return;
  e.preventDefault();
  var title=btn.getAttribute('data-detail-title')||'';
  if(!title||/^[a-z0-9-]+$/.test(title)){
    var source=btn.closest('.card,.sub-item,.phase');
    if(source){
      var titleEl=source.querySelector('.card-title,.phase-title,.si-name');
      if(titleEl){
        var clone=titleEl.cloneNode(true);
        var roleTags=clone.querySelectorAll('.role-tag');
        for(var i=0;i<roleTags.length;i++) roleTags[i].remove();
        title=clone.textContent.trim();
      }
    }
  }
  openDetailOverlay(btn.getAttribute('data-detail-id'),title);
});
