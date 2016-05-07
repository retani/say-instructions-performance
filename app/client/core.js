speak = function(text, cb) {
  console.log(SpeechSynthesisUtterance)
  if (!SpeechSynthesisUtterance) return false
  var utterance = new SpeechSynthesisUtterance(text);
  if (!utterance) return false
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  var ended = false
  utterance.onend = function(event) {
      ended = true
      if (cb) cb()
  };  
  window.speechSynthesis.speak(utterance);
  Meteor.setTimeout(function() {
    if (!ended) {
      console.log("should have ended. Trigger callback!")
      cb()
    }
  }, 500 * text.length); // there is a problem with onEnded, as it seem to fail sometimes. This is a fallback. Superficial assunmption is that that each letter needs somehow less than 500ms to pronounce
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
    Session.set('wrong', Session.get('wrong').concat([phrases[0]]));
    Session.set('wrongCounter', Session.get('wrongCounter')+1);
    Session.set('inFlow', false);
    announceNext(true, phrases[0])
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

lonelyWords = ['a','an','her','where','is','the', 'of','one', 'my']

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
  resume()
  console.log("LISTENING: " + command)
}

switchNext =  function(distance) { 
  Session.set('counter', Session.get('counter') + (distance ? distance : Session.get('length')))

  if (Session.get('spliced').isLast) {
    Meteor.setTimeout(function() {
      speak("Ready.", function(){
        Session.set('finished', true);
      })
    }, 1000);
    return
  }

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

  announceNext() 
}

announceNext = function(repeat = false, wrong = null) {
  if (repeat) {
    var command = Session.get('spliced').command;
  }
  else {
    var commands = {}
    var command = Session.get('spliced').command
    //Session.set('command', command);
  }
  console.log("COMMAND: " + command)    
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
          },6000)
        })    
      }, 500);        
    }
    else {
      pause()
      var text = ( wrong && Session.equals('annoyed_wrong',true) ? 'Not ' + wrong : '! ') 
        + ( repeat || Session.get('say_say') ? 'Say: ' : '') + command 
      console.log("speaking: " + text)
      speak(text, function(){
        console.log("spoken")
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

  if (typeof(beginWord) == 'undefined') return {
    past: string,
    percentage: 100
  }

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
    percentage: 100 * counter/wordsList.length
  }    
  return spliced  
}

switchNextLyrics = function(name) {
  Session.set('finished', false);
  var i = Session.get('playlistIndex')
  var new_i = (i < lyricsPlaylist.length-1 ? i+1 : 0)
  var nextLyricsName = lyricsPlaylist[new_i]
  Session.set('playlistIndex', new_i)
  Session.set('lyricsName', nextLyricsName)
  Tracker.flush()
  Session.set('counter', 0);
  Tracker.flush()
  announceNext()
}

parseText = function(text){

  console.log("parse text", text)

  if (!text || text.length == 0) return

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

  //console.log(tagsList)

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

  //console.log(wordsList)

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
}


Tracker.autorun(function () {

  console.log("autorun splice")

  Session.set('spliced', spliceText());
});

var pause = function() {
  //annyang.pause()
  console.log("pause()")
  annyang.abort()
  Session.set('annyangIsPaused', true);
}

var resume = function() {
  //annyang.resume()
  console.log("resume()")
  annyang.start()
  Session.set('annyangIsPaused', false);
}

// failsafe
Meteor.setInterval(function(){
  if (!annyang) return
  if (Session.equals('annyangIsPaused', false) && !annyang.isListening()) {
    colorLog("FAILSAFE RESUME", 'red')
    annyang.start()
  }    
},2000)

if (annyang) {
  initAnnyang()
  Session.set("browser_ok", false)
}
else {
  Session.set("browser_ok", true)
}
