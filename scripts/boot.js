// Render the whole page from the parsed content and initialise the interactive widgets.
function typesetMath(roots){
  if(!window.MathJax||!MathJax.typesetPromise) return Promise.resolve();
  var els=[].concat(roots||[]).filter(Boolean);
  if(els.length) return MathJax.typesetPromise(els);
  return Promise.resolve();
}
window.typesetMath=typesetMath;

function appendSectionDetails(id, title, contentEl, anchorEl){
  if(!id||!contentEl) return;
  if(anchorEl) anchorEl.id=id;
  contentEl.insertAdjacentHTML('beforeend', renderDetailsButton(id, title));
}

function renderAll(raw){
  var data=parseContent(raw);
  var sectionIds=data.sectionIds||{};

  var introBody=document.getElementById('intro-body');
  introBody.innerHTML=renderIntro(data.intro);
  appendSectionDetails(sectionIds.INTRO,'Introduction',introBody,document.getElementById('intro-card'));

  var main=document.getElementById('main'), html='';
  for(var i=0;i<data.phases.length;i++) html+=renderPhase(data.phases[i]);
  if(sectionIds.PHASES){
    html='<section id="'+escapeAttr(sectionIds.PHASES)+'">'
      +renderDetailsButton(sectionIds.PHASES,'Phases')
      +html
      +'</section>';
  }
  main.innerHTML=html;

  var glosOut=document.getElementById('glos-out');
  if(glosOut) glosOut.innerHTML=renderGlossary(data.glossary);
  appendSectionDetails(sectionIds.GLOSSARY,'Glossary',document.getElementById('s-glossary'),document.getElementById('glossary'));

  var highlightOut=document.getElementById('highlight-out');
  if(highlightOut) highlightOut.innerHTML=renderBones(data.bones);
  appendSectionDetails(sectionIds['BONES OF CONTENTION'],'Bones of Contention',document.getElementById('s-bones'),document.getElementById('bones'));

  if(window.CitationTools){
    window.CitationTools.hydrate({
      biblioGlobal:'BASIS_BIBLIO',
      citationSelector:'.cite-ref[data-cite]',
      footnoteSupSelector:'.footnote-ref',
      referencesOutSelector:'#refs-out',
      missingPrefix:'Reference details not found in central bibliography for '
    });
  }

  autoDefine(main,data.glossary);
  autoDefine(document.getElementById('intro-body'),data.glossary);
  autoDefine(highlightOut,data.glossary);
  enableTapTooltips();

  buildSidebar(data.phases);
  collectConnectors(data.phases);
  initConnectorObserver(main);
  drawConnectors();
  typesetMath([main, document.getElementById('intro-body'), highlightOut]).then(drawConnectors);
  document.dispatchEvent(new Event('basis-rendered'));
  if(window.location.hash) navigateToInPageTarget(window.location.hash);
}

function showContentLoadError(err){
  console.error(err);
  var main=document.getElementById('main');
  if(main){
    main.innerHTML='<p style="padding:2rem;color:#cc3333;line-height:1.6">Could not load <code>webpage.html</code>. '
      +'Open the site via a local web server (e.g. <code>python -m http.server</code> in the project folder), then refresh.</p>';
  }
}

function extractPageContent(raw){
  var match=raw.match(/^## INTRO\b/m);
  return match?raw.slice(match.index):raw;
}

function loadPageContent(){
  return fetch('webpage.html').then(function(res){
    if(!res.ok) throw new Error('HTTP '+res.status+' loading webpage.html');
    return res.text();
  }).then(function(html){
    var doc=new DOMParser().parseFromString(html,'text/html');
    var el=doc.getElementById('page-content');
    return extractPageContent(el?el.textContent:html);
  });
}

document.addEventListener('DOMContentLoaded',function(){
  loadPageContent().then(renderAll).catch(showContentLoadError);
});
document.addEventListener('beforematch',function(e){
  revealCollapsedForSearch(e.target);
},true);

function setFindHidden(el, hidden){
  if(!el) return;
  if(hidden) el.setAttribute('hidden','until-found');
  else el.removeAttribute('hidden');
}

function setExpanded(container, bodySel, expanded, inverted){
  var body=container.querySelector(bodySel);
  if(inverted){
    container.classList.toggle('collapsed',!expanded);
    setFindHidden(body,!expanded);
  }else{
    container.classList.toggle('open',expanded);
    setFindHidden(body,!expanded);
  }
}

function toggleContainer(container, bodySel, inverted){
  var expanded=inverted?container.classList.contains('collapsed'):!container.classList.contains('open');
  setExpanded(container, bodySel, expanded, inverted);
  setTimeout(drawConnectors,220);
}

function revealCollapsedForSearch(target){
  var node=target;
  while(node&&node!==document.body){
    if(node.classList){
      if(node.classList.contains('card')){
        node.classList.add('open');
        setFindHidden(node.querySelector('.card-body'),false);
      }else if(node.classList.contains('sub-item')){
        node.classList.add('open');
        setFindHidden(node.querySelector('.sub-item-body'),false);
      }else if(node.classList.contains('phase')){
        node.classList.remove('collapsed');
        setFindHidden(node.querySelector('.phase-nodes'),false);
      }else if(node.classList.contains('sec-collapsed')){
        node.classList.remove('sec-collapsed');
        setFindHidden(node,false);
        var prev=node.previousElementSibling;
        if(prev&&prev.classList.contains('sec-title')) prev.classList.remove('collapsed');
      }
    }
    node=node.parentElement;
  }
  setTimeout(drawConnectors,0);
}

function toggleSection(contentId, titleEl){
  var content=document.getElementById(contentId);
  var collapsed=content.classList.toggle('sec-collapsed');
  titleEl.classList.toggle('collapsed',collapsed);
  setFindHidden(content,collapsed);
  setTimeout(drawConnectors,220);
}

function revealSectionTitle(titleEl){
  if(!titleEl||!titleEl.classList.contains('sec-title')) return;
  var secId=titleEl.getAttribute('data-sec');
  if(!secId) return;
  var content=document.getElementById(secId);
  if(!content) return;
  titleEl.classList.remove('collapsed');
  content.classList.remove('sec-collapsed');
  setFindHidden(content,false);
}

function navigateToInPageTarget(hash){
  if(!hash||hash==='#') return false;
  var target=document.querySelector(hash);
  if(!target) return false;
  if(target.classList.contains('sec-title')&&target.getAttribute('data-sec')){
    revealSectionTitle(target);
  }
  revealCollapsedForSearch(target);
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  return true;
}

document.addEventListener('click',function(e){
  var cardHd=e.target.closest&&e.target.closest('.card-hd');
  if(cardHd){ toggleContainer(cardHd.parentElement,'.card-body',false); return; }
  var subHd=e.target.closest&&e.target.closest('.sub-item-hd');
  if(subHd&&!e.target.closest('a')){ toggleContainer(subHd.parentElement,'.sub-item-body',false); return; }
  var phaseHd=e.target.closest&&e.target.closest('.phase-hd');
  if(phaseHd){ toggleContainer(phaseHd.parentElement,'.phase-nodes',true); return; }
  var secTitle=e.target.closest&&e.target.closest('.sec-title[data-sec]');
  if(secTitle){ toggleSection(secTitle.getAttribute('data-sec'),secTitle); return; }

  var link=e.target.closest&&e.target.closest('a[href^="#"]');
  if(!link) return;
  var hash=link.getAttribute('href');
  if(!hash||hash==='#') return;
  if(!document.querySelector(hash)) return;
  var overlayBody=document.getElementById('detail-overlay-body');
  if(overlayBody&&overlayBody.contains(link)) return;
  e.preventDefault();
  var overlay=document.getElementById('detail-overlay');
  if(overlay&&overlay.open&&typeof closeDetailOverlay==='function') closeDetailOverlay();
  navigateToInPageTarget(hash);
  if(history.pushState) history.pushState(null,'',hash);
});

function toggleLinksState(enabled){
  document.body.classList.toggle('show-links',enabled);
  drawConnectors();
}

function toggleFloatingControls(btn){
  var dock=document.getElementById('floating-controls');
  if(!dock) return;
  var isCollapsed=dock.classList.toggle('is-collapsed');
  if(btn){
    btn.setAttribute('aria-expanded',isCollapsed?'false':'true');
    btn.setAttribute('aria-label',isCollapsed?'Expand quick controls':'Collapse quick controls');
    btn.title=isCollapsed?'Expand quick controls':'Collapse quick controls';
  }
}

function setAllSectionsExpanded(expanded){
  var phases=document.querySelectorAll('.phase');
  for(var i=0;i<phases.length;i++) setExpanded(phases[i],'.phase-nodes',expanded,true);

  var cards=document.querySelectorAll('.card');
  for(var j=0;j<cards.length;j++) setExpanded(cards[j],'.card-body',expanded,false);

  var subItems=document.querySelectorAll('.sub-item');
  for(var k=0;k<subItems.length;k++) setExpanded(subItems[k],'.sub-item-body',expanded,false);

  var secTitles=document.querySelectorAll('.sec-title:not(.no-toggle)');
  for(var m=0;m<secTitles.length;m++) secTitles[m].classList.toggle('collapsed',!expanded);

  var sections=document.querySelectorAll('#s-bones, #s-glossary, #s-references');
  for(var n=0;n<sections.length;n++){
    sections[n].classList.toggle('sec-collapsed',!expanded);
    setFindHidden(sections[n],!expanded);
  }

  drawConnectors();
}

window.addEventListener('resize', drawConnectors, {passive:true});
