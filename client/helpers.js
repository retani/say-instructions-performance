exit = function() {
  if (window.parent != window) { // in iframe
    window.parent.postMessage({ saymetadata:"close" }, "*" );    
  }
  else {
    location.reload()
  }
  
}