// Parse the source content into structured sections for the page renderer.
function parseContent(raw) {
  if(raw==null){
    var el=document.getElementById('page-content');
    raw=el?el.textContent:'';
  }
  var lines=raw.split('\n');
  var result={ intro:[], glossary:[], checklist:[], phases:[] };
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

  var FIELD_KEYS={
    rationale:'rationale',
    text:'body',
    'text-after':'bodyAfter',
    example:'example',
    important:'important',
    'sub-desc':'desc'
  };

  function fieldTarget(){
    if(curField==='rationale') return curPhase&&!curNode?curPhase:null;
    if(curField==='text'||curField==='text-after'||curField==='example'||curField==='important') return curNode;
    if(curField==='sub-desc') return curSub;
    return null;
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
      section=trimVal(line.slice(3)).replace(/\s+#.*$/,'').toUpperCase();
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
      if(section==='CHECKLIST'){
        var cp=trimVal(line.slice(4)).split('|');
        var itemMeta=splitDefinedId(trimVal(cp[0]));
        var lm=cp[1]&&trimVal(cp[1]).match(/LINK\s+(\S+)/);
        result.checklist.push({text:itemMeta.label,link:lm?lm[1]:(itemMeta.id||null)});
        continue;
      }
      flush();
      var subParts=parseSubItemRaw(trimVal(line.slice(4)));
      var subMeta=splitDefinedId(subParts.namePart);
      var subId=subMeta.id||('sub-item-'+((curNode&&curNode.subItems)?curNode.subItems.length+1:1));
      curSub={id:subId,icon:subParts.icon,name:subMeta.label,role:null,desc:''};
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
      curNode.important=line==='IMPORTANT'?'':'<strong>'+trimVal(line.slice(10))+'</strong>';
      curField='important';
      continue;
    }
    if(line.indexOf('LINK ')===0&&curNode){
      curNode.xlinks.push(trimVal(line.slice(5)));
      flush();
      continue;
    }
    if(section==='INTRO'){ result.intro.push(line); curField='intro'; continue; }
    if(section==='GLOSSARY'){
      var gp=line.split('|');
      if(gp.length>=2) result.glossary.push({term:trimVal(gp[0]),def:trimVal(gp[1])});
      continue;
    }
    if(section==='CHECKLIST'){
      if(line.indexOf('|')>-1){
        var cp=line.split('|');
        var itemMeta=splitDefinedId(trimVal(cp[0]));
        var lm=cp[1]&&trimVal(cp[1]).match(/LINK\s+(\S+)/);
        result.checklist.push({text:itemMeta.label,link:lm?lm[1]:(itemMeta.id||null)});
      }else if(result.checklist.length){
        result.checklist[result.checklist.length-1].text+=' '+line;
      }
      continue;
    }
    if(!isKeyword(line)&&curField&&appendToCurrentField(line)) continue;
  }

  return result;
}
