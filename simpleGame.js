
/* simpleGame.js
   a very basic game library for the canvas tag
   adapted from Python gameEngine
   Andy Harris - 2011
*/

/* Tylers TODO:
   - Add Force Model Physics :: DONE(11/30/11)
   - Create predefined blank tile where nothing is drawn :: DONE(11/30/11)
   - Precalculate animation frame locations :: DONE(12/3/11)
   - Show which side of a tile has been collided with. :: DONE(12/5/11)
   - Add boundary action that keeps you from moving past edge :: DONE(12/5/11)
   - Allow user to switch scenes
   - Allow user to animate a tile
   - Allow animation setting to play only a certain number of times
   - Allow user to set a tile onClick callback
   - Allow user to lock camera so that it will not display off tilemap
   - Add scrolling background
*/

//variable holding key being pressed
  var currentKey = null;
  var keysDown = new Array(256);

var Timer = function()
{
   this.date = new Date();
   this.lastTime = 0;
   this.currentTime = 0;
   
   this.start = function(){ 
	 this.currentTime = Date.now();
   }
   
   this.reset = function(){ 
	 this.currentTime = Date.now();
   }
   
   this.getTimeElapsed = function(){ 
     this.lastTime = this.currentTime;
	 this.currentTime = Date.now();
	 return (this.currentTime - this.lastTime);
   }
}

function Animation(spriteSheet, imgWidth, imgHeight, cellWidth, cellHeight){//for simplicity, all cells must be the same width and height combination
  this.sheet = spriteSheet;
  this.imgWidth = imgWidth;
  this.imgHeight = imgHeight;
  this.cellWidth = cellWidth;
  this.cellHeight = cellHeight;
  this.animationLength = 1000;
  this.changeLength = false;
  this.cycles = new Array();
  this.currentCycleName = "";
  this.currentCycle = null;
  this.cyclePlaySettings = new Array( PLAY_LOOP, PLAY_LOOP, PLAY_LOOP, PLAY_LOOP );
  this.changeAnimation = false;
  this.timer = new Timer();
  this.framesPerRow = 0;
  this.framesPerColumn = 0;
  this.totalCycleTime = 0;
  this.fps = 0;
  this.isPaused = false;
  
  this.setup = function(){
    this.timer.start();
	this.framesPerRow = Math.floor( this.imgWidth / this.cellWidth );
	this.framesPerColumn = Math.floor( this.imgHeight / this.cellHeight );
  }
  
  this.addCycle = function(cycleName, startingCell, frames){
    cellLocs = this.calculateFrameLocations( startingCell, frames );
    cycle = new Array(cycleName, startingCell, frames, cellLocs);
	this.cycles.push(cycle);
  }
  
  this.calculateFrameLocations = function( startCell, frames){
    frameLocs = new Array();
    for( i=0; i < frames; i++ ){
	  row = Math.floor( ( startCell + i ) / this.framesPerRow );
	  col = (startCell + i) - (row * this.framesPerRow);
	  frameY = row * this.cellHeight;
	  frameX = col * this.cellWidth;
	  frameLocs[i] = new Array( frameX, frameY );
	}
	return frameLocs;
  }
  
  this.drawFrame = function(ctx){//most of the math in this function could be done only once if we want to make it faster
    this.fps += 1;
    if( !this.isPaused ){ this.totalCycleTime += this.timer.getTimeElapsed(); }
    if(this.changeAnimation == true){// find the correct animation in
	  for( i = 0; i < this.cycles.length; i++ ){ 
	    if( this.cycles[i][0] == this.currentCycleName ){ 
		  this.currentCycle = this.cycles[i];
		}
	  }
	}
	if( this.changeAnimation || this.changeLength ){
	  this.frameDelta = this.animationLength / this.currentCycle[2]; // this will be how much time should pass at a minimum before switching to the next frame
	  this.changeAnimation = false;
	  this.changeLength = false;
	  this.fps = 0;
	}
	currentFrame = Math.floor( (this.totalCycleTime % this.animationLength) / this.frameDelta );
	frameX = this.currentCycle[3][currentFrame][0];
	frameY = this.currentCycle[3][currentFrame][1];
	ctx.drawImage(this.sheet, frameX, frameY, this.cellWidth, this.cellHeight, 0 - (this.cellWidth / 2), 0 - (this.cellHeight / 2), this.cellWidth, this.cellHeight);
  }
  
  this.setCycle = function(cycleName){
    this.currentCycleName = cycleName;
	this.changeAnimation = true;
	this.totalCycleTime = 0;
  }
  
  this.renameCycles = function(cycleNames){
    for(i = 0; i < cycleNames.length; i++){
	  number = parseInt( this.cycles[i][0].slice(5) );
	  if(this.currentCycleName == this.cycles[i][0]){ this.currentCycleName = cycleNames[number-1]; }
	  this.cycles[i][0] = cycleNames[number-1];
	}
  }
  
  this.play = function(){
    this.isPaused = false;
	this.timer.reset();
  }
  
  this.pause = function(){
    this.isPaused = true;
  }
  
  this.reset = function(){
    this.totalCycleTime = 0;
	this.timer.reset();
  }
  
  this.setAnimationSpeed = function( animLength ){//animLength is in milliseconds
    if( animLength <= 50 ){ animLength = 50; }
	this.animationLength = animLength;
	this.changeLength = true;
  }
  
}// end of Animation class

function Camera(scene){
  this.canvas = scene.canvas;
  this.context = this.canvas.getContext("2d");
  this.cHeight = parseInt(this.canvas.height);
  this.cWidth = parseInt(this.canvas.width);
  this.cameraOffsetX = 0;
  this.cameraOffsetY = 0;
  this.target = false;
  this.waitX = 0;
  this.waitY = 0;
  this.focalPointX = 0;
  this.focalPointY = 0;
  
  this.moveCamera = function(x, y){
    this.cameraOffsetX += x;
	this.cameraOffsetY += y;
  }
  
  this.followSprite = function(sprite, waitX, waitY){
	this.target = sprite;
	if( typeof waitX != "undefined" ){
	  this.waitX = waitX;
	  this.waitY = waitY;
	}
  }
  
  this.update = function(){
    // center the camera on the sprite
	this.focalPointX = this.cameraOffsetX + this.cWidth/2;
	this.focalPointY = this.cameraOffsetY + this.cHeight/2;
	mods = this.checkFocusBounds();
	if(this.target){
	  this.cameraOffsetX = this.target.x + (this.target.width/2) - (this.cWidth/2) + mods[0];
	  this.cameraOffsetY = this.target.y + (this.target.height/2) - (this.cHeight/2) + mods[1];
	}
  }
  
  this.checkFocusBounds = function(){
    centerX = this.target.x + (this.target.width/2);
	centerY = this.target.y + (this.target.height/2);
	distX = (this.focalPointX - centerX);
	distY = (this.focalPointY - centerY);
	waitModifier = new Array(distX, distY);
    if( distX >= this.waitX ){ waitModifier[0] = this.waitX; }
	if( distY >= this.waitY ){ waitModifier[1] = this.waitY; }
	if( distX < -1*this.waitX ){ waitModifier[0] = -1*this.waitX; }
	if( distY < -1*this.waitY ){ waitModifier[1] = -1*this.waitY; }
	return waitModifier;
  }
}

function Tile( mapX, mapY, x, y, type ){
  this.x = x;
  this.y = y;
  this.mapX = mapX;
  this.mapY = mapY;
  this.isCollidable = false;
  this.collisionCallback = false;
  this.type = type;
  this.isAnimated = false;
  this.isCollidable = false;
  this.isClickable = false;
  this.clickCallback = false;
  this.collisionType = NO_COLLISION;
  this.lastFrameCollisionFlag = false;
  
  this.setCollision = function( callBack ){
    this.collisionCallback = callBack;
	this.isCollidable = true;
  }
  
  this.setAnimation = function(){
    this.isAnimated = true;
  }
  
  this.setClick = function( callBack ){
    this.isClickable = true;
	this.clickCallback = callBack;
  }
  
  this.checkCollision = function( sprite, w, h ){
    this.collisionType = NO_COLLISION;
	setFlag = false;
	if( this.collisionCallback != false ){
		shw = sprite.width/2;
		shh = sprite.height/2;
		
		tileLeft = this.x;
		tileRight = this.x + w;
		tileTop = this.y;
		tileBottom = this.y + h;
		spriteLeft = sprite.x - shw;
		spriteRight = sprite.x + shw;
		spriteTop = sprite.y - shh;
		spriteBottom = sprite.y + shh;
		
		if (  !( (spriteBottom < tileTop) ||
			     (spriteTop > tileBottom) ||
			     (spriteRight < tileLeft) ||
			     (spriteLeft > tileRight) ) ){
			   
			   if( Math.abs(sprite.dx) > Math.abs(sprite.dy) ){
					if( sprite.dx < 0 ){ this.collisionType = COLLISION_RIGHT; sprite.x = tileRight + (shw+1); }
					if( sprite.dx > 0 ){ this.collisionType = COLLISION_LEFT; sprite.x = tileLeft - (shw+1); }
				}
				else{
					if( sprite.dy > 0 ){ this.collisionType = COLLISION_TOP; sprite.y = tileTop - (shh+1); }
					if( sprite.dy < 0 ){ this.collisionType = COLLISION_BOTTOM; sprite.y = tileBottom + (shh+1); }
				}
				setFlag = true;
				this.collisionCallback(this);
		}
	}
	if(this.lastFrameCollisionFlag){ this.lastFrameCollisionFlag = false; }
	if(setFlag){ this.lastFrameCollisionFlag = true; }
  }
  
}

function TileMap(scene){
  this.tileSheet = new Image();
  this.tiles = new Array();
  this.symbolImageMap = new Array();
  this.mapData = false;
  this.tileWidth = 0;
  this.tileHeight = 0;
  this.sheetWidth = 0;
  this.sheetHeight = 0;
  this.camera = new Camera(scene);
  
  this.loadTileSheet = function(tileWidth, tileHeight, sheetWidth, sheetHeight, tileSheet, tileSymbols){
    this.tileSheet.src = tileSheet;
	this.tileWidth = tileWidth;
	this.tileHeight = tileHeight;
	this.SheetWidth = sheetWidth;
	this.SheetHeight = sheetHeight;
	numRows = Math.floor(this.SheetWidth/this.tileWidth);
	numCols = Math.floor(this.SheetHeight/this.tileHeight);
	for(i = 0; i < numRows; i++){
	  for(j = 0; j < numCols; j++){
	    if( (i*numCols)+j < tileSymbols.length ){
	      this.symbolImageMap[(i*numCols)+j] = new Array( j*this.tileWidth, i*this.tileHeight, tileSymbols[(i*numCols)+j] );
		}
	  }
	}
  }
  
  this.loadMapData  = function(mapArray){// mapArray must be a 2-dimensional Array
    this.mapData = new Array();
	
    for(i = 0; i < mapArray.length; i++){
	  this.mapData.push( new Array() );
	  temp = new Array();
	  for(j = 0; j < mapArray[i].length; j++){
	    k = 0;
		notConverted = true;
	    while( notConverted && k < this.symbolImageMap.length ){
		  if( mapArray[i][j] == this.symbolImageMap[k][2]){ this.mapData[i][j] = k; notConverted = false; } // convert tile symbols to integers for faster comparisons
		  k++;
		  if( mapArray[i][j] == "blank" ){ this.mapData[i][j] = -1; notConverted = false; k = -1; }
		}
		temp[j] = new Tile(j, i, j*this.tileWidth, i*this.tileHeight, k);// k = tile type
	  }
	  this.tiles.push(temp)
	}
  }
  
  this.drawMap = function(){//this could be WAY faster
    this.camera.update();
    ctx = this.camera.context;
    for(i = 0; i < this.mapData.length; i++){//for each row
	  for(j = 0; j < this.mapData[i].length; j++){ //for each column of each row
	    drawX = this.tiles[i][j].x - this.camera.cameraOffsetX;
		drawY = this.tiles[i][j].y - this.camera.cameraOffsetY;
		if( 0 < drawX < this.camera.cWidth && 0 < drawY < this.camera.cHeight && this.mapData[i][j] != -1){
		  //don't draw any tiles that will not be in the camera's view
		  //also don't do any of this if the tile is blank
	      ctx.save();
	      sheetX = this.symbolImageMap[ this.mapData[i][j] ][0];
		  sheetY = this.symbolImageMap[ this.mapData[i][j] ][1];
		  ctx.translate(drawX, drawY);
		  ctx.drawImage(this.tileSheet, sheetX, sheetY, this.tileWidth, this.tileHeight, 0, 0, this.tileWidth, this.tileHeight);
		  if( this.tiles[i][j].collisionType != NO_COLLISION ){ 
		    ctx.strokeRect(0,0,this.tileWidth,this.tileHeight);//collision debug helper
		  }
		  ctx.restore();
		}
	  }
	}
  }
  
  this.addTileCollision = function( collisionCallback, typeOrX, y ){// accept tile type or coordinates
    if( typeof y == "undefined" ){ // then the first argument is a tile type
	  for( i = 0; i < this.tiles.length; i++ ){
	    for( j = 0; j < this.tiles[i].length; j++ ){
		  if( this.tiles[i][j].type == typeOrX ){
		    this.tiles[i][j].setCollision( collisionCallback );
		  }//end if
		}//end for j
	  }//end for i
	}//end if type
	else{ // then a tile coordinate was passed in
	  this.tiles[typeOrX][y].setCollision( collisionCallback );
	}
  }
  
  this.loadCollisionMap = function( collisionMap ){// tile Symbol and collision Callback - - NOTE: This function will overwrite specific Collision Callbacks
    //convert collisionMap symbols to their associated integers
	for( l = 0; l < collisionMap.length; l++ ){
	  c = 0;
	  notConverted = true;
	  while( c < this.symbolImageMap.length && notConverted ){
	    if( this.symbolImageMap[c][2] == collisionMap[l][0] ){
	      collisionMap[l][0] = c+1;
		  notConverted = false;
	    }
		c++;
	  }
	}
	//set collision callback for each tile
    for( i = 0; i < this.tiles.length; i++ ){
	  for( j = 0; j < this.tiles[i].length; j++ ){
	    k = 0;
		notAssigned = true;
	    while( k < collisionMap.length && notAssigned ){
	      if( this.tiles[i][j].type == collisionMap[k][0] ){
		    this.tiles[i][j].setCollision( collisionMap[k][1] );
			notAssigned = false;
		  }
		  k++;
		}
	  }
	}
  }
  
  this.mapScroll = function( dx, dy ){ this.camera.moveCamera(dx, dy); }
  this.cameraFollowSprite = function(sprite, waitX, waitY){ this.camera.followSprite(sprite, waitX, waitY); }
  
  this.addTileAnimation = function( imgWidth, imgHeight, cellWidth, cellHeight, type, animSheet ){
    this.animation = new Animation(animSheet, imgWidth, imgHeight, cellWidth, cellHeight);
	this.animation.setup();
  }
  
  this.addSpecificTileAnimation = function(){
  
  }
  
  this.checkCollisions = function(sprite){ //check for collisions between sprite and tile
    tileCoordX = Math.floor( sprite.x/this.tileWidth );
	tileCoordY = Math.floor( sprite.y/this.tileHeight );
	checkRowsBegin  = tileCoordX - 1;
	checkRowsEnd = tileCoordX + 2;
	checkColsBegin = tileCoordY - 1;
	checkColsEnd = tileCoordY + 2;
	if( tileCoordX > -1 && tileCoordY > -1 && tileCoordY < this.mapData.length && tileCoordX < this.mapData[tileCoordY].length ){// if sprite is in a tile
	  if( tileCoordX == 0 ){ checkRowsBegin = 0; }
	  if( tileCoordX == (this.mapData[tileCoordY].length-1) ){ checkRowsEnd = this.mapData.length; }
	  if( tileCoordY == 0 ){ checkColsBegin = 0; }
	  if( tileCoordY == (this.mapData.length-1) ){ checkColsBegin = this.mapData[tileCoordY].length; }
	  for( i = checkColsBegin; i < checkColsEnd; i++ ){
	    for( j = checkRowsBegin; j < checkRowsEnd; j++ ){
		  if( this.tiles[i][j].isCollidable ){
		    this.tiles[i][j].checkCollision(sprite, this.tileWidth, this.tileHeight);
		  }
		}
	  }
	}
  }
  
  this.makeSpriteMapRelative = function(sprite){ sprite.setCameraRelative( this.camera ); }
}

function Physics(){
  this.forces = new Array();
  
  this.addForce = function( dx, dy, name ){
    this.forces.push( new Array( dx, dy, name ) );
  }
  
  this.changeForce = function( ddx, ddy, name ){
    index = this.findForceIndex(name);
	this.forces[index][0] += ddx;
	this.forces[index][1] += ddy;
  }
  
  this.setForce = function( dx, dy, name){
    index = this.findForceIndex(name);
	this.forces[index][0] = dx;
	this.forces[index][1] = dy;
  }
  
  this.removeForce = function( name ){
    index = this.findForceIndex(name);
	this.forces.splice(index, 1);
  }
  
  this.findForceIndex = function( name ){
    for( i = 0; i < this.forces.length; i++){
	  if( this.forces[i][2] == name ){ return i; }
	}
	return -1; //if force is not found 
  }
  
  this.applyPhysics = function( ){
    dx = 0;
	dy = 0;
    for( i = 0; i < this.forces.length; i++ ){
      dx += this.forces[i][0];
	  dy += this.forces[i][1];
	}
	return new Array( dx, dy );
  }
}

function Sprite(scene, imageFile, width, height){ 
    //core class for game engine
    /*
    TODO:
      Add collision detection (DONE 2/4/11)
      Add access modifiers for x,y,dx,dy (DONE 10/26/11)
      Add multiple boundActions
      Support multiple images / states (DONE 10/26/11)
      Sprite element now expects scene rather than canvas
    */
  this.scene = scene;
  this.canvas = scene.canvas;
  this.context = this.canvas.getContext("2d");
  this.image = new Image();
  this.image.src = imageFile;
  this.animation = false; // becomes Animation Class
  this.width = width;
  this.height = height;
  this.cHeight = parseInt(this.canvas.height);
  this.cWidth = parseInt(this.canvas.width);
  this.x = 200;
  this.y = 200;
  this.dx = 10;
  this.dy = 0;
  this.ddx = 0;
  this.ddy = 0;
  this.imgAngle = 0;
  this.moveAngle = 0;
  this.speed = 10;
  this.camera = false;
  this.boundaryAction = BOUNDARY_WRAP;
  this.physics = new Physics();
  this.physics.addForce( this.dx, this.dy, "movement" );
  this.physics.addForce( 0, 0, "gravity" ) //default is no gravity
  this.isJumping = false;

  this.setPosition = function(x, y){
    //position is position of center
    this.x = x; 
    this.y = y;
  } // end setPosition function
  
  this.setX = function (nx){ this.x = nx; }
  this.setY = function (ny){ this.y = ny; }
  
  this.setChangeX = function (ndx){ 
    this.dx = ndx; 
	this.physics.setForce( this.dx, this.dy, "movement" );
  }
  
  this.setChangeY = function (ndy){ 
    this.dy = ndy; 
	this.physics.setForce( this.dx, this.dy, "movement" ); 
  }
  
  this.setGravity = function ( dx, dy ){ 
    this.physics.setForce( dx, dy, "gravity" );
  }
  
  this.turnOnGravity = function(){ 
	this.physics.setForce( 0, 2, "gravity" ); // <0, 2> is the default gravity vector
  }
  
  this.turnOffGravity = function(){ 
    this.physics.removeForce("gravity");
  }
  
  this.jump = function(){
    if( this.isJumping != true ){ this.physics.addForce(0, -30, "jump"); }
	this.isJumping = true;
  }
  
  this.land = function(){
    this.physics.removeForce("jump");
	this.isJumping = false;
  }
  
  this.setBoundaryAction = function(action){
    if( action == BOUNDARY_SCROLL && this.camera == false ){ this.camera = new Camera(this.scene); }
    this.boundaryAction = action;
  }

  this.draw = function(){
    //draw self on canvas;
		//intended only to be called from update, should never
		//need to be deliberately called
    ctx = this.context;

    ctx.save();
	if( this.camera ){ ctx.translate(this.x - this.camera.cameraOffsetX, this.y - this.camera.cameraOffsetY); }
	else{ ctx.translate(this.x, this.y); }
    ctx.rotate(this.imgAngle);
    //draw image with center on origin
	if( this.animation != false ){
      this.animation.drawFrame(ctx);
      ctx.strokeRect(0 - this.width/2,0 - this.height/2,this.width,this.height);//collision debug helper
	}
	else{
	  ctx.drawImage(this.image, 
           0 - (this.width / 2), 
           0 - (this.height / 2),
           this.width, this.height);
	}
    ctx.restore();
     
  } // end draw function

  this.applyPhysics = function(){
    if(this.isJumping == true ){ this.physics.changeForce(0, 2, "jump"); }
    velocityVec = this.physics.applyPhysics( ); 
	this.dx = velocityVec[0];
	this.dy = velocityVec[1];
	this.x += this.dx;
	this.y += this.dy;
  }
  
  this.update = function(){
	
	this.checkBounds();
    this.draw();
  } // end update

  this.checkBounds = function(){
		//currently only wraps.
		//add other boundary-checking behavior
		//-can be overwritten for custom behavior
	camX = 0;
	camY = 0;
	if(this.camera){ camX = this.camera.cameraOffsetX; camY = this.camera.cameraOffsetY; }
	rightBorder = this.cWidth + camX;
	leftBorder = camX;
	topBorder = camY;
	bottomBorder = this.cHeight + camY;
    if (this.x > rightBorder){
      if( this.boundaryAction == BOUNDARY_WRAP ){ this.x = leftBorder; }
	  if( this.boundaryAction == BOUNDARY_STOP ){ this.x = rightBorder; }
	  if( this.boundaryAction == BOUNDARY_SCROLL && this.camera ){ this.camera.moveCamera( (this.cHeight-this.height), 0 ); }
    } // end if

    if (this.y > bottomBorder){
	  if( this.boundaryAction == BOUNDARY_WRAP ){ this.y = topBorder; }
      if( this.boundaryAction == BOUNDARY_STOP ){ this.y = bottomBorder; }
	  if( this.boundaryAction == BOUNDARY_SCROLL && this.camera ){ this.camera.moveCamera(0, (this.cHeight-this.height) ); }
    } // end if

    if (this.x < leftBorder){
	  if( this.boundaryAction == BOUNDARY_WRAP ){ this.x = rightBorder; }
      if( this.boundaryAction == BOUNDARY_STOP ){ this.x = leftBorder; }
	  if( this.boundaryAction == BOUNDARY_SCROLL && this.camera ){ this.camera.moveCamera( -1*(this.cHeight-this.height), 0 ); }
    } // end if

    if (this.y < topBorder){
	  if( this.boundaryAction == BOUNDARY_WRAP ){ this.y = bottomBorder; }
      if( this.boundaryAction == BOUNDARY_STOP ){ this.y = topBorder; }
      if( this.boundaryAction == BOUNDARY_SCROLL && this.camera ){ this.camera.moveCamera(0, -1*(this.cHeight-this.height) ); }
    }
  } // end checkbounds

  this.loadAnimation = function (imgWidth, imgHeight, cellWidth, cellHeight){
    this.animation = new Animation(this.image, imgWidth, imgHeight, cellWidth, cellHeight);
	this.animation.setup();
  }
  
  this.generateAnimationCycles = function(slicingFlag, framesArray){
    //Default: assume each row is a cycle and give them names Cycle1, Cycle2, ... , CycleN
	//SINGLE_ROW: all the sprites are in one row on the sheet, the second parameter is either a number saying each cycle is that many frames or a list of how many frames each cycle is
	//SINGLE_COLUMN: all the sprites are in one column on the sheet, the second parameter is either a number saying each cycle is that many frames or a list of how many frames each cycle is
	//VARIABLE_LENGTH: How many frames are in each cycle. framesArray must be defined.
	cWidth = this.animation.cellWidth;
	cHeight = this.animation.cellHeight;
	iWidth = this.animation.imgWidth;
	iHeight = this.animation.imgHeight;
	numCycles = 0;
	nextStartingFrame = 0;
	  if(typeof framesArray == "number" || typeof slicingFlag == "undefined"){
	    if( slicingFlag == SINGLE_COLUMN ){ numCycles = (iHeight/cHeight)/framesArray; }
		else if( typeof slicingFlag == "undefined" ){ numCycles = (iHeight/cHeight); framesArray = iWidth/cWidth; }
	    else{ numCycles = (iWidth/cWidth)/framesArray; }
		for(t = 0; t < numCycles; t++){
		  cycleName = "cycle" + (t+1);
		  this.specifyCycle(cycleName, t*framesArray, framesArray);
		}
	  }
	  else{
	    numCycles = framesArray.length;
		for(i = 0; i < numCycles; i++){ 
		  cycleName = "cycle" + (i+1);
		  this.specifyCycle(cycleName, nextStartingFrame, framesArray[i]);
		  nextStartingFrame += framesArray[i];
		}
	  }
	this.setCurrentCycle("cycle1");
  }
  
  this.renameCycles = function(cycleNames){ this.animation.renameCycles(cycleNames); }
  this.specifyCycle = function(cycleName, startingCell, frames){ this.animation.addCycle(cycleName, startingCell, frames); }
  this.specifyState = function(stateName, cellName){ this.animation.addCycle(stateName, cellName, 1); }
  this.setCurrentCycle = function(cycleName){ this.animation.setCycle(cycleName); }
  this.pauseAnimation = function(){ this.animation.pause(); }
  this.playAnimation = function(){ this.animation.play(); }
  this.resetAnimation = function(){ this.animation.reset(); }
  this.setAnimationSpeed = function(speed){ this.animation.setAnimationSpeed(speed); }
  
  this.calcVector = function(){
    //used throughout speed / angle calculations to 
    //recalculate dx and dy based on speed and angle
    this.dx = this.speed * Math.cos(this.moveAngle);
    this.dy = this.speed * Math.sin(this.moveAngle);
  } // end calcVector

  this.setSpeed = function(speed){
    this.speed = speed;
    this.calcVector();
	this.physics.setForce(this.dx, this.dy, "movement");
  } // end setSpeed

  this.changeSpeedBy = function(diff){
    this.speed += diff;
    this.calcVector();
	this.physics.setForce(this.dx, this.dy, "movement");
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
	this.physics.setForce(this.dx, this.dy, "movement");
  } // end setMoveAngle

  this.changeMoveAngleBy = function(degrees){
    //convert diff to radians
    diffRad = degrees * Math.PI / 180;
    //add radian diff to moveAngle
    this.moveAngle += diffRad;
    this.calcVector();
	this.physics.setForce(this.dx, this.dy, "movement");
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
  
  this.setCameraRelative = function( cam ){ this.camera = cam; }

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
//Animation Constants
SINGLE_ROW = 1; SINGLE_COLUMN = 2; VARIABLE_LENGTH = 3;
PLAY_ONCE = 1; PLAY_LOOP = 2;
//Collision Constants
NO_COLLISION = 0; COLLISION_TOP = 1; COLLISION_BOTTOM = 2; COLLISION_LEFT = 3; COLLISION_RIGHT = 4
//Boundary Constants
BOUNDARY_WRAP = 1; BOUNDARY_STOP = 2; BOUNDARY_DIE = 3;BOUNDARY_SCROLL = 4;