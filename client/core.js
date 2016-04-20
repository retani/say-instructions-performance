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
    if (phrases && phrases.some(function(){ return Session.get('spliced').command.search(this) > -1 })) {
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

lonelyWords = ['a','an','her','where','is','the', 'of','one']

listenCurrent = function() {
  var commands = {}
  var command = Session.get('spliced').command
  /*
  commands['say ' + command] = {
    callback: function() {
      speak("Please.", function(){
        announceNext(true)
      })
    }
  } 
  */
  commands[command] = {
    regexp: new RegExp(command, 'i'),
    callback: switchNext
  }
  if (Session.equals('allow_say_yes', true)){
    commands['yes'] = {
      regexp: new RegExp('yes', 'i'),
      callback: switchNext
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

switchNext =  function() { 
  Session.set('counter', Session.get('counter') + Session.get('length'))

  Tracker.flush()
  var spliced = Session.get('spliced');

  // adjust length for blocks
  if (spliced.preLength) {
    Session.set('length', spliced.preLength);
  }
  // adjust length for lonely words
  else {
    if (lonelyWords.indexOf(spliced.command.toLowerCase()) > -1) Session.set('length',2)
    else Session.set('length',1)
  }

  //while (lonelyWords.indexOf(spliced.command.toLowerCase()))

  Tracker.flush()

  if (Session.get('spliced').isLast) {
    Session.set('finished', true);
  }
  else {
    announceNext() 
  }
}

announceNext = function(repeat = false) {
  if (repeat) {
    var command = Session.get('spliced').command;
  }
  else {
    var commands = {}
    var command = Session.get('spliced').command
    //Session.set('command', command);
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
      var text = ( repeat || Session.get('say_say') ? 'Say: ' : '') + command 
      speak(text, function(){
        resume()
        /*if (!repeat)*/ listenCurrent()
      })
    }
  }
}

spliceText = function() {
  var string = Session.get('text');
  var counter = Session.get('counter');
  var length = Session.get('length');
  var wordsList = Session.get('wordsList');
  var tagsList = Session.get('tagsList');
  if (!tagsList || !wordsList || tagsList.length == 0 || wordsList.length == 0) return {}

  var beginWord = wordsList[counter];
  var endWord = wordsList[counter+length-1];
  var beginIndex = beginWord.begin
  var endIndex = (wordsList[counter+length] ? wordsList[counter+length].begin-1 : string.length-1)

  var spliced = {
    command: _(wordsList.slice(counter, counter+length)).pluck('content').join(" "),
    commandComponents: wordsList.slice(counter, counter+length),
    current: string.substring(beginIndex, endIndex),
    past: string.substring(0,beginIndex),
    remains: string.substring(endIndex, string.length-1),
    preLength: beginWord.fixedLength,
    isLast: typeof(wordsList[counter+length]) == "undefined",
    percentage: 100 * counter/length
  }    
  return spliced  
}

Tracker.autorun(function () {

  console.log("autorun splice")

  Session.set('spliced', spliceText());
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
      colorLog("FAILSAFE RESUME", 'red')
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
