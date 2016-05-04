Session.setDefault('text', 'Once upon a time, the freak followed her home. Home is where peace resides. ');
Session.setDefault('spliced', {});
Session.setDefault('wordsList', []);
Session.setDefault('tagsList', []);
Session.setDefault('playlistIndex', 0);
Session.setDefault('lyricsName', null);
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
Session.setDefault('annyangIsPaused', true);
Session.setDefault('wrong', []);
Session.setDefault('wrongCounter', 0);
Session.setDefault('inFlow', true);
Session.setDefault('introStep', 0);
Session.setDefault('finished', false);
introStepComplete = 4

Session.setDefault('allow_say_yes', false);
Session.setDefault('say_say', true);
Session.setDefault('hint_skip_key', false);
Session.setDefault('reality_offset', {top:"5px", left:"5px"});
Session.setDefault('annoyed_wrong', false);
Session.setDefault('truth_opacity', 0.2);

Session.setDefault('testingPlayback', false);
Session.setDefault('activeTab', null);

// watch steps and states
Tracker.autorun(function () {
  $('body').attr('data-step', Session.get('introStep'))
  $('body').attr('data-listening-ok', Session.get('listening_ok'))
  $('body').attr('data-finished', Session.get('finished'))
});

// watch lyrics settings and transformations
Tracker.autorun(function () {
  var d = lyricsData[Session.get('lyricsName')]
  Session.get('wrong');
  if (!d) return // not loaded yet
  Session.set('say_say', Session.get('counter') < 6);
  Session.set('allow_say_yes', ( d.allow_say_yes ? d.allow_say_yes() : false ) );
  Session.set('hint_skip_key', ( d.hint_skip_key ? d.hint_skip_key() : false ) );
  if (Session.get('finished')) 
    Session.set('reality_offset', {top:0, left:0});  
  else 
    Session.set('reality_offset', ( d.reality_offset ? d.reality_offset() : {top:"5px", left:"5px"} ) );
  if (Session.get('wrongCounter') > 2 && Math.random() > 0.3 ) {
    Session.set('annoyed_wrong', true);
  }
  Session.set('truth_opacity', ( d.truth_opacity ? d.truth_opacity() : 0.2 ) );
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

Template.dancefloor.events({
  'click .next' : function(event) {
    switchNextLyrics();
  }
})

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
    //console.log(sanitizedPast)
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
  },
  'next' : function() {
    return Session.equals('finished', true) && lyricsPlaylist.length > 1
  },  
});

Template.dancefloor.events({
  /*'click button, load': function () {
    announceNext()
  }*/
});

Template.dancefloor.onRendered(function(){
  if (Session.get('spliced').preLength)
    Session.set('length', Session.get('spliced').preLength);
  Meteor.setTimeout(function(){
    announceNext()  
  },500)
  

  window.onkeydown = function(e) {  
    console.log(e)
    if (e.keyCode == 8) { // backspace
        switchNext()
        return false
    }
    if (e.keyCode == 27 && Session.get('counter') >= 1) { // escape
        Session.set('finished', false);
        switchNext(-1)
        return false
    }

    if (e.keyCode == 32) { // space
      switchNextLyrics()
    }

  }    
})

Template.truth.helpers({
  'opacity' : function() {
    //return ( Session.get('counter') > -1 ? "0.2" : "0" )
    return ( Session.get('finished') ? "1" : Session.get('truth_opacity'))
    //return "0.2"
  },
  'version' : function(name) {
    return name == Session.get('lyricsName')
  },
  'finished' : function() {
    return Session.equals('finished', true)
  }
})

Template.dancefloor.onCreated(function(){
  if (Session.equals('lyricsName', null)) {
    Session.set('lyricsName', lyricsPlaylist[Session.get('playlistIndex')])
  }
})

Tracker.autorun(function(){
  Session.get('lyricsName')
  if (Session.get('introStep') == introStepComplete){
    Tracker.afterFlush(function() {
      var text = $(".truth").html()
      parseText(text)
      console.log(Session.get('scpliced'))    
    })
  }
})

Template.truth.onRendered(function(){
  var template = this
  var text = $(template.firstNode).html()
  parseText(text)  
  console.log(Session.get('scpliced'))    
})

// separately get tags and words(including trailing .,?!): /(<[^>]*>)|(\w*[\.!\?,]?)/g

Template.Dialogue.onRendered(function(){
  $(".dialogue").draggable(/*{handle: ".dialogue-header"}*/)
});

Template.unsupportedMessage.onRendered(function(){
  speak(this.$(".speak").text())
})


Template.tests.helpers({
  'step' : function(step) {
    if (step) return Session.equals('introStep', step);
    else return Session.get('introStep');
  },
  headerText: function () {
    return "Setup – Step " + Session.get('introStep')
  }  
})

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
    //return (window.parent != window)
    return false;
  }
})

Template.close.events({
  'click .close' : function(event) {
    exit();
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
  },
  'available' : function() {
    return TemplateVar.get('available')
  }
})

Template.testMicrophone.onCreated(function(){
  /*
  var available = true
  var parentLoc = window.parent.location
  if (parentLoc != 'undefined') {
    if (parentLoc.protocol != "https:")
      var available = false
  }  
  TemplateVar.set('available', available)
  */
  TemplateVar.set('available', true)
})

Template.testMicrophone.onRendered(function(){

  if (TemplateVar.get("available")) {
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
  }

  annyang.addCommands({
    "let's go" : function() {
      Session.set('introStep', introStepComplete )
    }
  }, true);
  annyang.start()
})

Template.testMicrophone.onDestroyed(function(){
  if (meter) meter.shutdown();
})

Template.testListening.helpers({
  'infoText' : function() {
    return 'Thank you! Now we need to test speech recognition. Say "Hi, everybody".'
  }
})

Template.testListening.onCreated(function(){
  TemplateVar.set(this,"infoText", 'Thank you! Now we need to test speech recognition. Speak out loud: "Hi, everybody".')
  TemplateVar.set(this,"confirmText", "Hi! I read you. Let's go.")
})

Template.testListening.onRendered(function(){
  var template = this
  annyang.addCommands({
    'Hi everybody' : function() {
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

Template.explanation.events({
  "click h3": function (event) {
    var name = $(event.target).parent(".explanation").attr("data-name")
    var active = Session.get('activeTab');
    var new_active = null
    if (name == active) new_active = null
    else new_active = name
    Session.set('activeTab', new_active);
  },
  "click *": function(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
  },  
});

Template.explanation.helpers({
  playlistLength: function () {
    return lyricsPlaylist.length;
  },
  isActive: function(name) {
    return (Session.equals('activeTab', name) ? "active" : null);
  }
});

Template.explanation.onRendered(function(){
$('body').click(function (event) {
    //event.stopImmediatePropagation();
    Session.set('activeTab', null);
  })
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