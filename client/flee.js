Session.setDefault('text', 'Once upon a time, the freak followed her home. Home is where peace resides. ');
//Session.setDefault('text', 'Iteration is the act of repeating a process, either to generate a unbounded sequence of outcomes, or with the aim of approaching a desired goal, target or result. Each repetition of the process is also called an "iteration", and the results of one iteration are used as the starting point for the next iteration.');
//Session.setDefault('text', 'The main purpose of metadata is to facilitate in the discovery of relevant information, more often classified as resource discovery. Metadata also helps organize electronic resources, provide digital identification, and helps support archiving and preservation of the resource. Metadata assists in resource discovery by "allowing resources to be found by relevant criteria, identifying resources, bringing similar resources together, distinguishing dissimilar resources, and giving location information."')

Session.setDefault('browser_ok', false);
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
introStepComplete = 4

Session.setDefault('testingPlayback', false);

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
    var ar = Session.get('text').split(" ")
    var remains = ar.splice(0, Session.get('counter'))
    //var remains = remains.concat(ar[0])
    //speak(ar[0])
    return remains.join(' ')
  },
  'command' : function () {
    return Session.get('command');
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
  }    
})

Template.truth.onRendered(function(){
  var text = $(this.firstNode).html()
  var raw = text.replace(/(<([^>]+)>)/ig,"").trim();
  Session.set('text', raw);
  console.log(raw)
  
  var elem = $(this.firstNode).get(0)
  // http://stackoverflow.com/a/18927821
  var array = [];

  for(var i = 0, childs = elem.childNodes; i < childs.length; i ++) {
    if (childs[i].nodeType === 3 /* document.TEXT_NODE */) {
      array = array.concat(childs[i].nodeValue.trim().split(/\s+/));
    } else {
      array.push(childs[i].outerHTML);
    }
  }

  console.log(array)
})

Template.tests.onCreated(function() {
  if (Session.equals('introStep', 0))
    Session.set('introStep', 1)
  console.log(Session.get('introStep'))
})

Template.tests.events({
  
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
      //Session.set('introStep', Session.get('introStep')+1)
      annyang.abort()
      TemplateVar.set(template, 'understood', true)
      speak(TemplateVar.get(template, "confirmText"), function(){
        Session.set('introStep', Session.get('introStep')+1)
      })
    }
  }, true);
  annyang.start()
})

var sound = new Howl({
  urls: ['go_ahead.wav'],
  autoplay : false,
  volume : 0.1
})

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