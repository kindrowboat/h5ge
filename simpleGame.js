
/* simpleGame.js
   a very basic game library for the canvas tag
   adapted from Python gameEngine
   Andy Harris - 2011
*/

//variable holding key being pressed
  var currentKey = null;
  var keysDown = new Array(256);

function Sprite(scene, imageFile, width, height){
    //core class for game engine
    /*
    TODO:
      Add collision detection (DONE 2/4/11)
      Add access modifiers for x,y,dx,dy
      Add multiple boundActions
      Support multiple images / states
      Sprite element now expects scene rather than canvas
    */
  this.canvas = scene.canvas;
  this.context = this.canvas.getContext("2d");
  this.image = new Image();
  this.image.src = imageFile;
  this.width = width;
  this.height = height;
  this.cHeight = parseInt(this.canvas.height);
  this.cWidth = parseInt(this.canvas.width);
  this.x = 200;
  this.y = 200;
  this.dx = 10;
  this.dy = 0;
  this.imgAngle = 0;
  this.moveAngle = 0;
  this.speed = 10;

  this.setPosition = function(x, y){
    //position is position of center
    this.x = x; 
    this.y = y;
  } // end setPosition function

  this.draw = function(){
    //draw self on canvas;
		//intended only to be called from update, should never
		//need to be deliberately called
    ctx = this.context;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.imgAngle);

    //draw image with center on origin
    ctx.drawImage(this.image, 
         0 - (this.width / 2), 
         0 - (this.height / 2),
         this.width, this.height);
    ctx.restore();
     
  } // end draw function

  this.update = function(){
    this.x += this.dx;
    this.y += this.dy;
    this.checkBounds();

    this.draw();
  } // end update

  this.checkBounds = function(){
		//currently only wraps.
		//add other boundary-checking behavior
		//-can be overwritten for custom behavior
    if (this.x > this.cWidth){
      this.x = 0;
    } // end if

    if (this.y > this.cHeight){
      this.y = 0;
    } // end if

    if (this.x < 0){
      this.x = this.cWidth;
    } // end if

    if (this.y < 0){
      this.y = this.cHeight;
    }
  } // end checkbounds

  this.calcVector = function(){
    //used throughout speed / angle calculations to 
    //recalculate dx and dy based on speed and angle
    this.dx = this.speed * Math.cos(this.moveAngle);
    this.dy = this.speed * Math.sin(this.moveAngle);
  } // end calcVector

  this.setSpeed = function(speed){
    this.speed = speed;
    this.calcVector();
  } // end setSpeed

  this.changeSpeedBy = function(diff){
    this.speed += diff;
    this.calcVector();
  } // end changeSpeedBy

  this.setImgAngle = function(degrees){
    //convert degrees to radians
    this.imgAngle = degrees * Math.PI / 180;
  } // end setImgAngle

  this.changeImgAngleBy = function(degrees){
    rad = degrees * Math.PI / 180;
    this.imgAngle += rad;
  } // end changeImgAngle

  this.setMoveAngle = function(degrees){
    //take movement angle in degrees
    //convert to radians
    this.moveAngle = degrees * Math.PI / 180;
    this.calcVector();
  } // end setMoveAngle

  this.changeMoveAngleBy = function(degrees){
    //convert diff to radians
    diffRad = degrees * Math.PI / 180;
    //add radian diff to moveAngle
    this.moveAngle += diffRad;
    this.calcVector();
  } // end changeMoveAngleBy

  //convenience functions combine move and img angles
  this.setAngle = function(degrees){
    this.setMoveAngle(degrees);
    this.setImgAngle(degrees);
  } // end setAngle

  this.changeAngleBy = function(degrees){
      this.changeMoveAngleBy(degrees);
      this.changeImgAngleBy(degrees);
  } // end changeAngleBy
  
  this.collidesWith = function(sprite){
    //define borders
    myLeft = this.x;
    myRight = this.x + this.width;
    myTop = this.y;
    myBottom = this.y + this.height;
    otherLeft = sprite.x;
    otherRight = sprite.x + sprite.width;
    otherTop = sprite.y;
    otherBottom = sprite.y + sprite.height;

    //assume collision
    collision = true;
    
    //determine non-colliding states
    if ((myBottom < otherTop) ||
        (myTop > otherBottom) ||
        (myRight < otherLeft) ||
        (myLeft > otherRight)) {
          collision = false;
    } // end if
    return collision;
  } // end collidesWith

  this.report = function(){
      //used only for debugging. Requires browser with JS console
      console.log ("x: " + this.x + ", y: " + this.y + ", dx: "
		   + this.dx + ", dy: " + this.dy
		   + ", speed: "  + this.speed
		   + ", angle: " + this.moveAngle);
  } // end report
} // end Sprite class def

function Scene(){
    //Scene that encapsulates the animation background
    /*
    TODO: 
      AddSprite method
      Put sprites in linked list
      Automatically update each sprite in list
      Add keyboard input (initial version done)
      array of keydowns like PyGame? (DONE: 2/25/11)
      keyboard constants (DONE: 2/25/11)
      Consider drawing canvas directly on page - position absolute
      (DONE - Scene now creates own canvas)
      mouse input
      virtual buttons for portable devices
    */

    //determine if it's a touchscreen device
    touchable = 'createTouch' in document;
    
    //dynamically create a canvas element
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    
    this.clear = function(){
      this.context.clearRect(0, 0, this.width, this.height);
    }

    this.start = function(){
      //set up keyboard reader if not a touch screen.
      if (!touchable){
	this.initKeys();
	document.onkeydown = this.updateKeys;
	document.onkeyup = this.clearKeys;
      } // end if
      this.intID = setInterval(localUpdate, 50);
    } 

    this.stop = function(){
      clearInterval(this.intID);
    }

    this.updateKeys = function(e){      
      //set current key
      currentKey = e.keyCode;
      keysDown[e.keyCode] = true;
    } // end updateKeys
    
    this.clearKeys = function(e){
      currentKey = null;
      keysDown[e.keyCode] = false;
    } // end clearKeys
    
    this.initKeys = function(){
      //initialize keys array to all false
      for (keyNum = 0; keyNum < 256; keyNum++){
	      keysDown[keyNum] = false;
      } // end for
    } // end initKeys
    
    this.setSizePos = function(height, width, top, left){
      //modify the canvas' style to conform to the new parameters
      //styleString = "background-color: yellow; \n";
      styleString = "";
      styleString += "position: absolute; \n";
      styleString += "height: " + height + "px;\n";
      styleString += "width: " + width + "px;\n";
      styleString += "top: " + top + "px;\n";
      styleString += "left: " + left + "px;\n";
      //this.canvas.setAttribute("style", styleString);
      
      this.height = height;
      this.width = width;
      this.top = top;
      this.left = left;

      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.style.left = this.left;
      this.canvas.style.top = this.top;

    } // end setSizePos

    this.setSize = function(width, height){
      //set the width and height of the canvas in pixels
      this.width = width;
      this.height = height;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    } // end setSize
    
    this.setPos = function(left, top){
      //set the left and top position of the canvas
      //offset from the page
      this.left = left;
      this.top = top;
      this.canvas.style.left = left;
      this.canvas.style.top = top;
    } // end setPos
    
    this.setBG = function(color){
      this.canvas.style.backgroundColor = color;
    } // end this.setBG
    
    this.setSize(400, 300);
    this.setPos(10, 100);
    this.setBG("lightgray");

} // end Scene class def

function Sound(src){
  //sound effect class
  //builds a sound effect based on a url
  //ogg is preferred.
  this.snd = document.createElement("audio");
  this.snd.src = src;
  
  this.play = function(){
    this.snd.play();
  } // end play function
} // end sound class def

function Joy(){
  //virtual joystick for ipad
  
  //properties
  this.SENSITIVITY = 50;
  this.diffX = 0;
  this.diffY = 0;
  var touches = [];
  var startX;
  var startY;
  
  //define event handlers
  this.onTouchStart = function(event){
    result = "touch: ";
    touches = event.touches;
    startX = touches[0].screenX;
    startY = touches[0].screenY;
    result += "x: " + startX + ", y: " + startY;
    console.log(result);
  } // end onTouchStart
  
  this.onTouchMove = function(event){
    result = "move: "
    event.preventDefault();
    touches = event.touches;
    this.diffX = touches[0].screenX - startX;
    this.diffY = touches[0].screenY - startY;
    result += "dx: " + this.diffX + ", dy: " + this.diffY;
    console.log(result);
  } // end onTouchMove
  
  this.onTouchEnd = function(event){
    result = "no touch";
    touches = event.touches;
    this.diffX = 0;
    this.diffY = 0;
  } // end onTouchEnd
  
  //add event handlers if appropriate
  touchable = 'createTouch' in document;
  if (touchable){
    document.addEventListener('touchstart', this.onTouchStart, false);
    document.addEventListener('touchmove', this.onTouchMove, false);
    document.addEventListener('touchend', this.onTouchEnd, false);
  } // end if
  
  this.getDX = function(){
    return "At least I work...";
    return this.diffX;
  } // end getDX
  
  this.getDY = function(){
    return this.diffY;
  } // end getDY
} // end joy class def

function localUpdate(){
    //will be called once per frame
    update();
    //put sprite update code here...
} // end localUpdate

//keyboard constants
K_A = 65; K_B = 66; K_C = 67; K_D = 68; K_E = 69; K_F = 70; K_G = 71;
K_H = 72; K_I = 73; K_J = 74; K_K = 75; K_L = 76; K_M = 77; K_N = 78;
K_O = 79; K_P = 80; K_Q = 81; K_R = 82; K_S = 83; K_T = 84; K_U = 85;
K_V = 86; K_W = 87; K_X = 88; K_Y = 89; K_Z = 90;
K_LEFT = 37; K_RIGHT = 39; K_UP = 38;K_DOWN = 40; K_SPACE = 32;
  
