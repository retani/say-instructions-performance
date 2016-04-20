lyricsName = 'default'

lyricsData = {
  'default' : {
    'allow_say_yes' : function() {
      return Session.get('counter') > 9
    },
    'hint_skip_key' : function() {
      return Session.get('counter') > 16 && ((Session.get('counter')-1) % 4 == 0)
    }    
  },
  'dd' : {
  }
}
