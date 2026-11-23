// Parse the source content into structured sections for the page renderer.
var PHASE_ACCENT_HEX={ c1:'#2d6a4f', c2:'#1a5276', c3:'#6c3483', c4:'#b7471c', c5:'#117a65' };

function phaseAccentFromOutline(num){
  var phase=parseInt(String(num||'').split('.')[0],10);
  return PHASE_ACCENT_HEX['c'+phase]||PHASE_ACCENT_HEX.c1;
}

function parseContent(raw) {
  if(raw==null){
    var el=document.getElementById('page-content');
    raw=el?el.textContent:'';
  }
  var lines=raw.split('\n');
  var result={ intro:[], sectionIds:{}, glossary:[], bones:[], attention:[], phases:[], outlineById:{} };
  var section=null, curPhase=null, curNode=null, curSub=null, curField=null;

  function flush(){ curField=null; }
  function trimVal(s){ return s.replace(/^\s+|\s+$/g,''); }
  function colorFor(num){ return ['c1','c2','c3','c4','c5'][num-1]||'c1'; }
  function splitDefinedId(text){
    var match=text.match(/^(.*?)(?:\s+#([a-zA-Z0-9\-]+))?\s*$/);
    return { label:trimVal(match?match[1]:text), id:match&&match[2]?match[2]:'' };
  }

  function isSubItemIcon(token){
    if(!token) return false;
    if(/^&(?:#\d+|#x[\da-f]+|[a-z]+);$/i.test(token)) return true;
    if(/^[A-Za-z]/.test(token)) return false;
    return true;
  }

  function parseSubItemRaw(sRaw){
    var iconMatch=sRaw.match(/^(\S+)\s+(.*)$/);
    if(iconMatch&&isSubItemIcon(iconMatch[1])){
      return { icon:iconMatch[1], namePart:trimVal(iconMatch[2]) };
    }
    return { icon:'', namePart:sRaw };
  }

  function sectionList(name){
    if(name==='BONES OF CONTENTION'){
      return { items:result.bones, field:'bones-desc', fallbackId:'bone' };
    }
    if(name==='ATTENTION REQUIRED'){
      return { items:result.attention, field:'attention-desc', fallbackId:'attention' };
    }
    return null;
  }

  var FIELD_KEYS={
    rationale:'rationale',
    text:'body',
    'text-after':'bodyAfter',
    example:'example',
    important:'important',
    'sub-desc':'desc',
    'bones-desc':'desc',
    'attention-desc':'desc'
  };

  function fieldTarget(){
    if(curField==='rationale') return curPhase&&!curNode?curPhase:null;
    if(curField==='text'||curField==='text-after'||curField==='example'||curField==='important') return curNode;
    if(curField==='sub-desc') return curSub;
    if(curField==='bones-desc'&&result.bones.length) return result.bones[result.bones.length-1];
    if(curField==='attention-desc'&&result.attention.length) return result.attention[result.attention.length-1];
    return null;
  }

  function parseSectionJump(pipeTail){
    var m=pipeTail&&trimVal(pipeTail).match(/JUMP\s+(\S+)/);
    return m?m[1]:null;
  }

  function pushSectionItem(list, rawName, pipeTail){
    var subParts=parseSubItemRaw(trimVal(rawName));
    var itemMeta=splitDefinedId(subParts.namePart);
    var itemId=itemMeta.id||(list.fallbackId+'-'+(list.items.length+1));
    list.items.push({
      id:itemId,
      icon:subParts.icon,
      name:itemMeta.label,
      desc:'',
      jump:parseSectionJump(pipeTail)
    });
    curField=list.field;
  }

  function appendToCurrentField(line){
    var target=fieldTarget(), key=FIELD_KEYS[curField];
    if(!target||!key) return false;
    if(!target[key]) target[key]=line;
    else target[key]+=' '+line;
    return true;
  }

  function breakParagraph(){
    var target=fieldTarget(), key=FIELD_KEYS[curField];
    if(!target||!key) return false;
    if((curField==='example'||curField==='important')&&!target[key]) target[key]='';
    target[key]+='\n\n';
    return true;
  }

  function isKeyword(line){
    return line.indexOf('--- ')===0||line.indexOf('>>> ')===0||
           line.indexOf('ROLE ')===0||line.indexOf('RATIONALE ')===0||
           line==='RATIONALE'||line.indexOf('TEXT ')===0||line==='TEXT'||
           line.indexOf('EXAMPLE ')===0||line==='EXAMPLE'||line.indexOf('IMPORTANT ')===0||line==='IMPORTANT'||
           line.indexOf('LINK ')===0;
  }

  for(var i=0;i<lines.length;i++){
    var line=trimVal(lines[i]);
    if(line===''){
      if(section==='INTRO'&&curField==='intro') result.intro.push('');
      if(!breakParagraph()) curField=null;
      continue;
    }
    if(line.indexOf('## ')===0){
      var sectionMeta=splitDefinedId(trimVal(line.slice(3)));
      section=sectionMeta.label.toUpperCase();
      if(sectionMeta.id) result.sectionIds[section]=sectionMeta.id;
      curPhase=null; curNode=null; curSub=null; curField=null;
      continue;
    }
    if(line.indexOf('=== ')===0){
      flush();
      var phaseMeta=splitDefinedId(trimVal(line.slice(4))), dotPos=phaseMeta.label.indexOf('.');
      var pNum=dotPos>-1?parseInt(phaseMeta.label.slice(0,dotPos),10):(result.phases.length+1);
      var pTitle=dotPos>-1?trimVal(phaseMeta.label.slice(dotPos+1)):phaseMeta.label;
      curPhase={id:phaseMeta.id||('phase-'+pNum),title:pTitle,role:'',color:colorFor(pNum),phaseNum:String(pNum),rationale:'',nodes:[]};
      result.phases.push(curPhase);
      curNode=null; curSub=null;
      continue;
    }
    if(line.indexOf('--- ')===0){
      flush();
      var nodeMeta=splitDefinedId(trimVal(line.slice(4)));
      var nodeId=nodeMeta.id||('node-'+((curPhase&&curPhase.nodes)?curPhase.nodes.length+1:1));
      curNode={id:nodeId,title:nodeMeta.label,role:null,body:'',bodyAfter:'',subItems:[],xlinks:[],example:null,important:null};
      if(curPhase) curPhase.nodes.push(curNode);
      curSub=null;
      continue;
    }
    if(line.indexOf('>>> ')===0){
      var list=sectionList(section);
      if(list){
        flush();
        var cp=trimVal(line.slice(4)).split('|');
        pushSectionItem(list,cp[0],cp[1]);
        continue;
      }
      flush();
      var subParts=parseSubItemRaw(trimVal(line.slice(4)));
      var subMeta=splitDefinedId(subParts.namePart);
      var subId=subMeta.id||('sub-item-'+((curNode&&curNode.subItems)?curNode.subItems.length+1:1));
      curSub={id:subId,icon:subParts.icon,name:subMeta.label,role:null,desc:'',xlinks:[]};
      if(curNode) curNode.subItems.push(curSub);
      curField='sub-desc';
      continue;
    }
    if((line.indexOf('ROLE ')===0||line==='ROLE')&&(curSub||curNode||curPhase)){
      var roleValue=line==='ROLE'?'':trimVal(line.slice(5));
      if(curSub){
        curSub.role=roleValue;
        curField='sub-desc';
      }else if(curNode){
        curNode.role=roleValue;
        flush();
      }else{
        curPhase.role=roleValue;
        flush();
      }
      continue;
    }
    if((line.indexOf('RATIONALE ')===0||line==='RATIONALE')&&curPhase&&!curNode){
      curPhase.rationale=line==='RATIONALE'?'':trimVal(line.slice(10));
      curField='rationale';
      continue;
    }
    if((line.indexOf('TEXT ')===0||line==='TEXT')&&curNode){
      var textVal=line==='TEXT'?'':trimVal(line.slice(5));
      if(curNode.subItems.length>0){
        curNode.bodyAfter=textVal;
        curField='text-after';
      }else{
        curNode.body=textVal;
        curField='text';
      }
      continue;
    }
    if((line.indexOf('EXAMPLE ')===0||line==='EXAMPLE')&&curNode){
      curNode.example=line==='EXAMPLE'?'':'<strong>'+trimVal(line.slice(8))+'</strong>';
      curField='example';
      continue;
    }
    if((line.indexOf('IMPORTANT ')===0||line==='IMPORTANT')&&curNode){
      var importantText=line==='IMPORTANT'?'':'<strong>'+trimVal(line.slice(10))+'</strong>';
      if(curNode.important&&importantText) curNode.important+='\n\n'+importantText;
      else if(importantText||!curNode.important) curNode.important=importantText;
      curField='important';
      continue;
    }
    if(line.indexOf('LINK ')===0&&(curSub||curNode)){
      var linkTarget=trimVal(line.slice(5));
      if(curSub){
        curSub.xlinks.push(linkTarget);
        curField='sub-desc';
      }else{
        curNode.xlinks.push(linkTarget);
        flush();
      }
      continue;
    }
    if(section==='INTRO'){ result.intro.push(line); curField='intro'; continue; }
    if(section==='GLOSSARY'){
      var gp=line.split('|');
      if(gp.length>=2) result.glossary.push({term:trimVal(gp[0]),def:trimVal(gp[1])});
      continue;
    }
    var activeList=sectionList(section);
    if(activeList){
      if(line.indexOf('|')>-1){
        flush();
        var cp=line.split('|');
        pushSectionItem(activeList,cp[0],cp[1]);
      }else if(curField===activeList.field&&appendToCurrentField(line)){
        /* appended to desc */
      }else if(activeList.items.length){
        activeList.items[activeList.items.length-1].name+=' '+line;
      }
      continue;
    }
    if(!isKeyword(line)&&curField&&appendToCurrentField(line)) continue;
  }

  attachOutlineNumbers(result.phases, result.outlineById);
  return result;
}

function attachOutlineNumbers(phases, byId){
  for(var p=0;p<(phases||[]).length;p++){
    var ph=phases[p], pn=String(ph.phaseNum);
    if(ph.id) byId[ph.id]=pn;
    for(var n=0;n<(ph.nodes||[]).length;n++){
      var nd=ph.nodes[n], itemNum=pn+'.'+(n+1);
      nd.outlineNum=itemNum;
      if(nd.id) byId[nd.id]=itemNum;
      var subs=nd.subItems||[];
      for(var s=0;s<subs.length;s++){
        subs[s].outlineNum=itemNum+'.'+(s+1);
        if(subs[s].id) byId[subs[s].id]=subs[s].outlineNum;
      }
    }
  }
}

function extractPageContent(raw){
  var match=raw.match(/^## INTRO\b/m);
  return match?raw.slice(match.index):raw;
}

function loadPageContent(url){
  return fetch(url||'webpage.html').then(function(res){
    if(!res.ok) throw new Error('HTTP '+res.status+' loading webpage.html');
    return res.text();
  }).then(function(html){
    var doc=new DOMParser().parseFromString(html,'text/html');
    var el=doc.getElementById('page-content');
    return extractPageContent(el?el.textContent:html);
  });
}
