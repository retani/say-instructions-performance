Session.setDefault('text', 'Once upon a time, the freak followed her home. Home is where peace resides. ');
Session.setDefault('spliced', {});
Session.setDefault('wordsList', []);
Session.setDefault('tagsList', []);
//Session.setDefault('text', 'Iteration is the act of repeating a process, either to generate a unbounded sequence of outcomes, or with the aim of approaching a desired goal, target or result. Each repetition of the process is also called an "iteration", and the results of one iteration are used as the starting point for the next iteration.');
//Session.setDefault('text', 'The main purpose of metadata is to facilitate in the discovery of relevant information, more often classified as resource discovery. Metadata also helps organize electronic resources, provide digital identification, and helps support archiving and preservation of the resource. Metadata assists in resource discovery by "allowing resources to be found by relevant criteria, identifying resources, bringing similar resources together, distinguishing dissimilar resources, and giving location information."')

Session.setDefault('browser_ok', false);
Session.setDefault('listening_ok', false);
Session.setDefault('counter', 0);
Session.setDefault('length', 1);
Session.setDefault('command', null);
Session.setDefault('auto', false);
Session.setDefault('log', []);
Session.setDefault('annyangIsListening', false);
Session.setDefault('annyangIsPaused', false);
Session.setDefault('wrong', []);
Session.setDefault('inFlow', true);
Session.setDefault('introStep', 0);
Session.setDefault('finished', false);
introStepComplete = 4

Session.setDefault('allow_say_yes', false);
Session.setDefault('say_say', true);
Session.setDefault('hint_skip_key', false);
Session.setDefault('reality_offset', {top:"5px", left:"5px"});

Session.setDefault('testingPlayback', false);

// watch steps and states
Tracker.autorun(function () {
  $('body').attr('data-step', Session.get('introStep'))
  $('body').attr('data-listening-ok', Session.get('listening_ok'))
});

// watch lyrics settings and transformations
Tracker.autorun(function () {
  var d = lyricsData[lyricsName]
  Session.set('say_say', Session.get('counter') < 6);
  Session.set('allow_say_yes', ( d.allow_say_yes ? d.allow_say_yes() : false ) );
  Session.set('hint_skip_key', ( d.hint_skip_key ? d.hint_skip_key() : false ) );
  if (Session.get('finished')) 
      Session.set('reality_offset', {top:0, left:0});  
  else if ( d.reality_offset && !(Session.equals('reality_offset', d.reality_offset())) )
    Session.set('reality_offset', d.reality_offset());
  
  //Session.set('hint_skip_key', counter > 16);
});

Template.layout.helpers({
  'introActive': function () {
    return Session.get('introStep') < introStepComplete
  },
  'unsupported' : function() {
    return Session.get("browser_ok")
  },
  'isListening' : function() {
    return Session.get('annyangIsListening');
  },
  'isPaused' : function() {
    return Session.get('annyangIsPaused');
  }  
});

Template.dancefloor.helpers({
  counter: function () {
    return Session.get('counter');
  },
  text: function () {
    var past = Session.get("spliced").past
    Session.get('wrong').forEach(function (wrong) {
      past += ' <span class="wrong">' + wrong + '</span> '
    });
    
    var sanitizedPast = sanitizeHtml(past, {
      allowedTags: false,
      allowedAttributes: false
    })
    console.log(sanitizedPast)
    return sanitizedPast
  },
  'command' : function () {
    return Session.get('spliced').command;
  },
  'log' : function() {
    return Session.get('log');
  },
  'hideInfo' : function() {
    return ( Session.equals('auto', false) && Session.get('counter') > 20)
  },
  'wrong' : function() {
    return Session.get('wrong');
  },
  'listening' : function() {
    return Session.get('annyangIsListening');
  },
  'yes' : function() {
    return Session.equals('allow_say_yes', true) 
  },
  'hint_key' : function() {
    return Session.equals('hint_skip_key', true) 
  },
  'finished' : function() {
    return Session.equals('finished', true)
  },
  'reality_offset' : function() {
    return Session.get('reality_offset')
  }
});

Template.dancefloor.events({
  /*'click button, load': function () {
    announceNext()
  }*/
});

Template.dancefloor.onRendered(function(){
  announceNext()

  window.onkeydown = function(e) {  
    console.log(e)
    if (e.keyCode == 8) {
        switchNext()
        return false
    }
    if (e.keyCode == 27) {
        Session.set('finished', false);
        switchNext(-1)
        return false
    }    
  }    
})

Template.truth.helpers({
  'opacity' : function() {
    //return ( Session.get('counter') > -1 ? "0.2" : "0" )
    //return ( Session.get('finished') ? "0" : "0.2" )
    return "0.2"
  },
  'version' : function(name) {
    return name == lyricsName
  },
  'finished' : function() {
    return Session.equals('finished', true)
  },  
})

Template.truth.onRendered(function(){
  var text = $(this.firstNode).html()

  var regexTags  = /<[^>]*>/g
  var regex = regexTags
  var temp;
  var index = 0;
  var tagsList = []
  while ((temp = regex.exec(text)) !== null && index < 1000) {
    //console.log(temp)
    //var msg = 'Found ' + temp[0] + ' ' + temp['index'] + " - " + regex.lastIndex;
    //console.log(msg);
    index++
    tagsList.push ({
      'content': temp[0],
      'begin': temp['index'],
      'end': regex.lastIndex,
      'tagName': temp[0].match(/\w+/)[0],
      'opens': temp[0].substr(1,1) != "/"
    })
  }  

  console.log(tagsList)

  var wordsList = []
  var wordsListIndex = 0
  var fixedLengthSection = false
  var fixedLengthSectionWordIndex = 0
  for(var i=-1; i < tagsList.length; i++) {
    if (i == -1) {
      var begin = 0
      var end   = (tagsList[0].begin == 0 ? 0 : tagsList[0].begin)
    }
    else {
      var begin = tagsList[i].end
      var end   = ( tagsList[i+1] ? tagsList[i+1].begin : text.length-1)
    }
    var tag = tagsList[i]
    if (tag) console.log(tag.tagName)
    if (tag && tag.tagName == "cite") {
      fixedLengthSection = tag.opens
      if (tag.opens) {
        fixedLengthSectionWordIndex = wordsListIndex
      }
      else {
        //console.log(wordsListIndex, fixedLengthSectionWordIndex)
        wordsList[fixedLengthSectionWordIndex].fixedLength = wordsListIndex - fixedLengthSectionWordIndex
      }
      
    }

    var chunk = text.substring(begin, end)
    var regex = /\w+/g
    var words = []
    var temp
    var index = 0
    while ((temp = regex.exec(chunk)) !== null && index < 1000) {
      //var msg = 'Found ' + temp[0] + ' ' + temp['index']+begin + " - " + regex.lastIndex+begin;
      //console.log(msg);
      index++
      wordsListIndex++
      wordsList.push ({
        'content': temp[0],
        'begin': temp['index']+begin,
        'end': regex.lastIndex+begin,
        'tagsListIndex': i,
        'fixedLength': fixedLengthSection
      })
    }
    //console.log(i, words, chunk)
  }

  console.log(wordsList)

  Session.set('text', text);
  Session.set('tagsList', tagsList);
  Session.set('wordsList', wordsList);

  // var wordsList = []
  // tagsList.forEach(function (tagElem, index) {
  //   var begin = tagElem.end
  //   console.log(text.substring(tagElem.begin, tagElem.end))

  // });

  // var parts = text.match(/(<[^>]*>)|(\w*[\.!\?,]?)/g)
  // var parts = _(parts).filter(function(x){return x.length > 0})
  // console.log(parts)

  // var raw = text.replace(/(<([^>]+)>)/ig,"").replace(/(\n|\r)/," ").replace(/\s{2,}/,' ').trim();
  // Session.set('text', raw);
  // console.log(raw)
  
  // var elem = $(this.firstNode).get(0)
  // // http://stackoverflow.com/a/18927821
  // var array = [];

  // for(var i = 0, childs = elem.childNodes; i < childs.length; i ++) {
  //   if (childs[i].nodeType === 3 /* document.TEXT_NODE */) {
  //     array = array.concat(childs[i].nodeValue.trim().split(/\s+/));
  //   } else {
  //     array.push(childs[i].outerHTML);
  //   }
  // }

  // console.log(array)

  
})

// separately get tags and words(including trailing .,?!): /(<[^>]*>)|(\w*[\.!\?,]?)/g

Template.tests.onCreated(function() {
  if (Session.equals('introStep', 0))
    Session.set('introStep', 1)
  console.log(Session.get('introStep'))
})

Template.tests.onRendered(function(){
  window.onkeydown = function(e) {  
    console.log(e)
    if (e.keyCode == 8) {
      Session.set('introStep', introStepComplete);
      return false
    }    
  }     
})

Template.close.helpers({
  'available' : function() {
    return (window.parent != window)
  }
})

Template.close.events({
  'click .close' : function(event) {
    exit();
  }
})

Template.tests.helpers({
  'step' : function(step) {
    if (step) return Session.equals('introStep', step);
    else return Session.get('introStep');
  }
})


Template.testSpeakers.events({
  'click .toggle_playback' : function(event) {
    TemplateVar.set("playing",!TemplateVar.get("playing"))
    var template = Template.instance()    
    if (TemplateVar.get("playing")) {
      // start playing
      var i = 1;
      var speakTest = function(i) {
        console.log("speak test ("+i+")")
        speak("1,2.", function(){
          if (TemplateVar.get(template, "playing")) {
            speakTest(i+1);
          }
        })
      }
      speakTest(i);
    }
  },
  'click .continue' : function(event) {
    TemplateVar.set("playing",false)
    Session.set('introStep', Session.get('introStep')+1 );
  }
})

Template.testSpeakers.helpers({
  'playing' : function() {
    return TemplateVar.get("playing")
  }
})

Template.testMicrophone.events({
  'click .toggle_playback' : function(event) {
    TemplateVar.set("playing",!TemplateVar.get("playing"))
    var template = Template.instance()    
    if (TemplateVar.get("playing")) {
      // start playing
      var i = 1;
      var speakTest = function(i) {
        console.log("speak test ("+i+")")
        speak("1,2.", function(){
          if (TemplateVar.get(template, "playing")) {
            speakTest(i+1);
          }
        })
      }
      speakTest(i);
    }
  },
  'click .continue' : function(event) {
    TemplateVar.set("playing",false)
    Session.set('introStep', Session.get('introStep')+1 );
  }
})

Template.testMicrophone.helpers({
  'playing' : function() {
    return TemplateVar.get("playing")
  }
})

Template.testMicrophone.onRendered(function(){
  audioContext = null;
  meter = null;
  canvasContext = null;
  audioMeterWIDTH=500;
  audioMeterHEIGHT=50;
  clipLevel = 0.98;
  averaging = 0.95;
  clipLag = 750;
  rafID = null;
  audioMeterInit(document.getElementById( "meter" ));
  meter = createAudioMeter(audioContext,clipLevel,averaging,clipLag);

  annyang.addCommands({
    "let's go" : function() {
      Session.set('introStep', introStepComplete )
    }
  }, true);
  annyang.start()
})

Template.testMicrophone.onDestroyed(function(){
  meter.shutdown();
})

Template.testListening.helpers({
  'infoText' : function() {
    return 'Thank you! Now we need to test speech recognition. Say "Hello".'
  }
})

Template.testListening.onCreated(function(){
  TemplateVar.set(this,"infoText", 'Thank you! Now we need to test speech recognition. Speak out the word "Hello".')
  TemplateVar.set(this,"confirmText", "Very Good! I read you. Let's go.")
})

Template.testListening.onRendered(function(){
  var template = this
  annyang.addCommands({
    'hello' : function() {
      annyang.abort()
      Session.set('listening_ok', true)
      TemplateVar.set(template, 'understood', true)
      speak(TemplateVar.get(template, "confirmText"), function(){
        Session.set('introStep', Session.get('introStep')+1)
      })
    }
  }, true);
  annyang.start()
})


Template.indicatorPanel.helpers({
  'visible' : function() {
    return ( Session.equals('finished', false) )
  }
})

/*
var sound = new Howl({
  urls: ['go_ahead.wav'],
  autoplay : false,
  volume : 0.1
})
*/

Meteor.setInterval(function(){
  //if (Session.equals('annyangIsListening', true))
    //sound.play()
    Session.set('annyangIsListening', annyang.isListening());
}, 500)



/*
Template.testSpeakers.events({
  
})

Template.testSpeakers.helpers({
  
})

Template.testSpeakers.events({
  
})

Template.testSpeakers.helpers({
  
})

Template.testSpeakers.events({
  
})

Template.testSpeakers.helpers({
  
})
*/