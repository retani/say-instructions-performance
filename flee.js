speak = function(text, cb) {
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);  
  utterance.onend = function(event) {
      if (cb) cb()
  };

/*
  if (Meteor.isServer) {
    Say.speak(null, text)
  }
  else {
    console.log("SPEAK: " + text)
    Meteor.call('speak', text, function (error, result) {
      cb()
    });
  }
  */
}

speakSync = Meteor.wrapAsync(function(text,cb){
  speak(text,cb)
})

if (Meteor.isClient) {

  Session.setDefault('text', 'Metadata is "data that provides information about other data". Two types of metadata exist: structural metadata and descriptive metadata. Structural metadata is data about the containers of data. Descriptive metadata uses individual instances of application data or the data content. Metadata was traditionally in the card catalogs of libraries. As information has become increasingly digital, metadata is also used to describe digital data using metadata standards specific to a particular discipline. Describing the contents and context of data or data files increases their usefulness. For example, a web page may include metadata specifying what language the page is written in, what tools were used to create it, and where to find more information about the subject; this metadata can automatically improve the reader\'s experience. The main purpose of metadata is to facilitate in the discovery of relevant information, more often classified as resource discovery. Metadata also helps organize electronic resources, provide digital identification, and helps support archiving and preservation of the resource. Metadata assists in resource discovery by "allowing resources to be found by relevant criteria, identifying resources, bringing similar resources together, distinguishing dissimilar resources, and giving location information.');
  //Session.setDefault('text', 'The main purpose of metadata is to facilitate in the discovery of relevant information, more often classified as resource discovery. Metadata also helps organize electronic resources, provide digital identification, and helps support archiving and preservation of the resource. Metadata assists in resource discovery by "allowing resources to be found by relevant criteria, identifying resources, bringing similar resources together, distinguishing dissimilar resources, and giving location information."')

  Session.setDefault('counter', 0);
  Session.setDefault('command', null);
  Session.setDefault('auto', false);
  Session.setDefault('log', []);
  Session.setDefault('annyangIsListening', false);
  Session.setDefault('annyangIsPaused', false);

  Template.hello.helpers({
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
      return ( Session.equals('auto', false) && Session.get('counter') > 2)
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      //Session.set('counter', Session.get('counter') + 1);
      announceNext()
    }
  });

  listenCurrent = function() {
    var commands = {}
    var command = Session.get('command')
    commands[command] = function() { Session.set('counter', Session.get('counter') + 1); announceNext() }
    //annyang.removeCommands();
    annyang.addCommands(commands);
    annyang.debug()
    if (Session.equals('annyangIsListening', false)) {
      console.log("START LISTENING")
      annyang.start(/*{continuous: false}*/);
      Session.set('annyangIsListening', true);
    }
    else if (Session.equals('annyangIsPaused', true)) {
      console.log("RESUME LISTENING")
      annyang.resume();
    }
    console.log("LISTENING: " + command)
  }

  announceNext = function(repeat = false) {
    if (repeat) {
      var command = Session.get('command');
    }
    else {
      var ar = Session.get('text').split(" ")
      var remains = ar.splice(0, Session.get('counter'))
      var commands = {}
      var command = ar[0].replace(/\W/g, '')
      Session.set('command', command);
      console.log("NEW COMMAND: " + command)    
    }
    if (command != null && command != "") {
      //annyang.pause(); Session.set('annyangIsPaused', true);
      if (Session.equals('auto', true)) {
        if (!repeat) listenCurrent()
        Meteor.setTimeout(function() {
          if (typeof autoRepeatTimer != "undefined") Meteor.clearTimeout(autoRepeatTimer)
          speak("" + command, function(){
            autoRepeatTimer = Meteor.setTimeout(function() {
              announceNext(true)
              console.log("REPEATING")
            },8000)
          })    
        }, 500);        
      }
      else {
        speak("Say: " + command, function(){
          /*if (!repeat)*/ listenCurrent()
        })    
      }
    }
  }

  Tracker.autorun(function () {
  });


  (function() {
      var exLog = console.log;
      console.log = function(msg) {
          exLog.apply(this, arguments);
          var newLog = Session.get('log')
          newLog = newLog.concat([msg.replace('%c','')])
          Session.set('log', newLog);
      }
  })()  

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    //speak("ready")
  });

  Meteor.methods({
    'speak' : function(text) {
      speakSync(text)
    }
  })
}

