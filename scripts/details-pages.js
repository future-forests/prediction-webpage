// Detail page overlay — pages live at details/{id}.html, matching each #id in basis.html.
var DETAIL_PLACEHOLDER_TEXT='This page is a placeholder for this section/sub-section and will be completed later.';

function isDetailPlaceholderHtml(html){
  var doc=new DOMParser().parseFromString(html,'text/html');
  var body=doc.body;
  if(!body) return true;
  var clone=body.cloneNode(true);
  var scripts=clone.querySelectorAll('script, style');
  for(var i=0;i<scripts.length;i++) scripts[i].remove();
  var text=clone.textContent.replace(/\s+/g,' ').trim();
  return text===DETAIL_PLACEHOLDER_TEXT;
}

function hidePlaceholderDetailButtons(){
  var buttons=document.querySelectorAll('.more-details-btn[data-detail-page]');
  var seen={};
  for(var i=0;i<buttons.length;i++){
    (function(page){
      if(!page||seen[page]) return;
      seen[page]=true;
      fetch(page).then(function(res){ return res.ok?res.text():''; })
        .then(function(html){
          if(!isDetailPlaceholderHtml(html)) return;
          var matches=document.querySelectorAll('.more-details-btn[data-detail-page="'+page+'"]');
          for(var j=0;j<matches.length;j++){
            var row=matches[j].closest('.details-row');
            if(row) row.hidden=true;
            else matches[j].hidden=true;
          }
        })
        .catch(function(){});
    })(buttons[i].getAttribute('data-detail-page'));
  }
}

function normalizeDetailContent(body){
  if(!body||body.dataset.detailNormalized) return;
  var blockChildren=[].filter.call(body.children,function(el){
    return !/^(SCRIPT|STYLE)$/i.test(el.tagName);
  });
  var hasBlocks=blockChildren.some(function(el){
    return /^(P|UL|OL|LI|DIV|TABLE|BLOCKQUOTE|H[1-6]|HR|SECTION|ARTICLE|PRE)$/i.test(el.tagName);
  });
  if(hasBlocks){
    body.dataset.detailNormalized='skip';
    return;
  }
  var parts=body.innerHTML.split(/\n\s*\n+/).map(function(part){ return part.trim(); }).filter(Boolean);
  if(parts.length<=1){
    body.dataset.detailNormalized='skip';
    return;
  }
  body.innerHTML=parts.map(function(part){ return '<p class="detail-block">'+part+'</p>'; }).join('');
  body.dataset.detailNormalized='1';
}

function typesetDetailFrame(doc){
  if(!doc||!doc.body) return;
  normalizeDetailContent(doc.body);
  var win=doc.defaultView;
  if(win.MathJax&&win.MathJax.typesetPromise){
    win.MathJax.typesetPromise([doc.body]);
    return;
  }
  var s=doc.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js';
  s.onload=function(){
    if(win.MathJax&&win.MathJax.typesetPromise) win.MathJax.typesetPromise([doc.body]);
  };
  doc.head.appendChild(s);
}

function handleDetailOverlayEscape(e){
  if(e.key!=='Escape') return;
  var dialog=document.getElementById('detail-overlay');
  if(!dialog||!dialog.open) return;
  e.preventDefault();
  closeDetailOverlay();
}

function bindDetailFrameEscape(doc){
  if(!doc||doc.documentElement.dataset.detailEscapeBound) return;
  doc.documentElement.dataset.detailEscapeBound='1';
  doc.addEventListener('keydown',handleDetailOverlayEscape);
}

function openDetailOverlay(page, title){
  var dialog=document.getElementById('detail-overlay');
  var frame=document.getElementById('detail-overlay-frame');
  var titleEl=document.getElementById('detail-overlay-title');
  if(!dialog||!frame){
    window.location.href=page;
    return;
  }

  if(titleEl){
    titleEl.textContent='More details: '+(title||'');
  }
  frame.onload=function(){
    try{
      var doc=frame.contentDocument;
      if(!doc||!doc.body) return;
      doc.body.classList.add('embedded-detail');
      bindDetailFrameEscape(doc);
      typesetDetailFrame(doc);
    }catch(err){}
  };
  frame.src=page;
  document.body.classList.add('detail-overlay-open');

  if(typeof dialog.showModal==='function') dialog.showModal();
  else dialog.setAttribute('open','open');
}

function closeDetailOverlay(){
  var dialog=document.getElementById('detail-overlay');
  var frame=document.getElementById('detail-overlay-frame');
  if(frame) frame.src='about:blank';
  if(dialog&&dialog.open){
    dialog.close();
  }else if(dialog){
    dialog.removeAttribute('open');
  }
  document.body.classList.remove('detail-overlay-open');
}

document.addEventListener('keydown',handleDetailOverlayEscape);

document.addEventListener('DOMContentLoaded',function(){
  var dialog=document.getElementById('detail-overlay');
  if(dialog){
    dialog.addEventListener('click',function(e){
      if(e.target===dialog) closeDetailOverlay();
    });
    dialog.addEventListener('close',function(){
      document.body.classList.remove('detail-overlay-open');
      var frame=document.getElementById('detail-overlay-frame');
      if(frame) frame.src='about:blank';
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
  var btn=e.target.closest&&e.target.closest('.more-details-btn[data-detail-page]');
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
  openDetailOverlay(btn.getAttribute('data-detail-page'),title);
});
