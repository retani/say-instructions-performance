speak = function(text, cb) {
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);  
  utterance.onend = function(event) {
      if (cb) cb()
  };
}

/*
initLog = function() {
    var exLog = console.log;
    console.log = function(msg) {
        exLog.apply(this, arguments);
        var newLog = Session.get('log')
        newLog = newLog.concat([msg.replace('%c','')])
        Session.set('log', newLog);
    }
}
initLog()
*/

initAnnyang = function(){
  annyang.addCallback('resultNoMatch', function(phrases){
    console.log(phrases)
    if (!Session.equals('introStep', introStepComplete)) return;
    if (phrases && phrases.some(function(){ return Session.get('command').search(this) > -1 })) {
      console.log("twice")
    }
    console.log("wrong")
    Session.set('wrong', Session.get('wrong').concat(phrases));
    Session.set('inFlow', false);
    announceNext(true)
  })
  annyang.addCallback('resultMatch', function(phrases){
    console.log(phrases)
    if (!Session.equals('introStep', introStepComplete)) return;
    Session.set('wrong', []);
    Session.set('inFlow', true);
  })  
  annyang.addCallback('start', function(){
    colorLog("START",'red')
  })    
  annyang.addCallback('end', function(){
    colorLog("END",'red')
  })      
}

lonelyWords = ['a','an','her','where','is','the', 'of']

listenCurrent = function() {
  var commands = {}
  var command = Session.get('command')
  commands[command] = {
    regexp: new RegExp(command, 'i'),
    callback: 
      function() { 
      Session.set('counter', Session.get('counter') + Session.get('length'))
      
      // adjust length for lonely words
      if (lonelyWords.indexOf(splicedText().command.toLowerCase()) > -1) Session.set('length',2)
      else Session.set('length',1)

      announceNext() 
    }
  }
  console.log(commands)
  annyang.removeCommands();
  annyang.addCommands(commands, true);
  //annyang.init(commands, true);
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
    var commands = {}
    var command = splicedText().command
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
      pause()
      speak(/*"Say: " + */command, function(){
        resume()
        /*if (!repeat)*/ listenCurrent()
      })
    }
  }
}

splicedText = function() {
  var ar = Session.get('text').split(" ")
  var remains = ar.splice(0, Session.get('counter'))
  var command = ""
  var current = ""
  var commandComponents = []
  for (var i=0; i<Session.get('length'); i++) {
    var component = ar[i].replace(/\W/g, '')
    command = (command + " " + component).trim()
    commandComponents.push(component)
    current = current + ar[i]
  }
  return {
    command: command,
    commandComponents: commandComponents,
    current: current,
    past: ar.join(" "),
    remains: remains.splice(0, Session.get('length')).join(" "),
  }
}

Tracker.autorun(function () {
});

var pause = function() {
  //annyang.pause()
  annyang.abort()
  Session.set('annyangIsPaused', true);
}

var resume = function() {
  annyang.resume()
  //annyang.start()
  Session.set('annyangIsPaused', false);

  // failsafe
  Meteor.setTimeout(function(){
    if (!annyang.isListening()) {
      colorLog("FAILSAFE RESUME", red)
      annyang.resume()
    }    
  },500)
}

if (annyang) {
  initAnnyang()
  Session.set("browser_ok", false)
}
else {
  Session.set("browser_ok", true)
}
