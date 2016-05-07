lyricsName = 'dd1'
lyricsPlaylist = ['dd1','dd2','dd3']


lyricsData = {
  'default' : {/*
    'allow_say_yes' : function() {
      return Session.get('counter') > 9
    },
    'hint_skip_key' : function() {
      return Session.get('counter') > 16 && ((Session.get('counter')-1) % 4 == 0)
    },*//*
    'offset' : function() {
      return {
        top: "7px",
        left: "7px"
      }
    }*/
  },
  'dd' : {
  },
  'dd1' : {
    'offset' : function() {
      return {
        top: "8px",
        left: "10px"
      }    
    }
  },  
  'dd2' : {
    'offset' : function() {
      return {
        top: 2 * Session.get('wrong').length + "px",
        left: 2 * Session.get('wrong').length + "px"
      }    
    },    
    'truth_opacity' : function() {
      return 0.2 - 0.15*Session.get('counter')/Session.get('wordsList').length;
    }    
  },  
  'dd3' : {
    'truth_opacity' : function() {
      return "0";
    }
  },  
}
