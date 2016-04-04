Session.setDefault('text', 'Once upon a time, the freak followed her home. Home is where peace resides. ');
//Session.setDefault('text', 'Iteration is the act of repeating a process, either to generate a unbounded sequence of outcomes, or with the aim of approaching a desired goal, target or result. Each repetition of the process is also called an "iteration", and the results of one iteration are used as the starting point for the next iteration.');
//Session.setDefault('text', 'The main purpose of metadata is to facilitate in the discovery of relevant information, more often classified as resource discovery. Metadata also helps organize electronic resources, provide digital identification, and helps support archiving and preservation of the resource. Metadata assists in resource discovery by "allowing resources to be found by relevant criteria, identifying resources, bringing similar resources together, distinguishing dissimilar resources, and giving location information."')

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
introStepComplete = 3

Session.setDefault('testingPlayback', false);

Template.layout.helpers({
  'introActive': function () {
    return Session.get('introStep') < introStepComplete
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
  }
});

Template.dancefloor.events({
  'click button': function () {
    // increment the counter when button is clicked
    //Session.set('counter', Session.get('counter') + 1);
    announceNext()
  }
});

Template.tests.onCreated(function() {
  if (Session.equals('introStep', 0))
    Session.set('introStep', 1)
  console.log(Session.get('introStep'))
})

Template.tests.events({
  
})

Template.tests.helpers({
  'step' : function(step) {
    return Session.equals('introStep', step);
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

Template.testListening.events({
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

Template.testListening.helpers({
  'playing' : function() {
    return TemplateVar.get("playing")
  }
})

Template.testListening.onRendered(function(){
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
    'hello' : function() {
      Session.set('introStep', Session.get('introStep')+1 )
    }
  }, true);
  annyang.start()
})

Template.testListening.onDestroyed(function(){
  meter.shutdown();
})

var sound = new Howl({
  urls: ['go_ahead.wav'],
  autoplay : false,
  volume : 0.1
})

Meteor.setInterval(function(){
  //if (Session.equals('annyangIsListening', true))
    //sound.play()
}, 2000)

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