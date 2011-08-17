//virtual Joystick
function Joy(doc) {
  //doc is the document of the parent page
  this.x = 0;
  this.y = 0
  this.dx = 0;
  this.dy = 0;
  this.startX = 0;
  this.startY = 0;
  this.touches = [];
  
  this.init = function(){
    document = this.doc;
    touchable = 'createTouch' in document;
    if (touchable){
      document.addEventListener('touchstart', this.onTouchStart, false);
      document.addEventListener('touchmove', this.onTouchMove, false);
      document.addEventListener('touchend', this.onTouchEnd, false);
    } // end if
  } // end init
  
  this.onTouchStart = function(event){
    this.touches = event.touches;
    this.startX = this.touches[0].screenX;
    this.startY = this.touches[0].screenY;
  } // end onTouchStart
  
  this.onTouchMove = function(event){
    event.preventDefault();
    this.touches = event.touches;
    this.dx = this.touches[0].screenX - this.startX;
    this.dy = this.touches[0].screenY - this.startY;
  } // end onTouchMove
  
  this.onTouchEnd = function(event){
    this.touches = event.touches;
    this.dx = 0;
    this.dy = 0;
  } // end onTouchEnd
  
} // end class def

  
