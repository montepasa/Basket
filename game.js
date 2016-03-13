var game;

var ball;

var launchRectangle = new Phaser.Rectangle(30, 250, 200, 150);

var trajectoryGraphics;

// ibrahim aker
var forceMult = 5;

var launchVelocity;

var crateBody;

var crateSpeed = 160;

window.onload = function() {	
	game = new Phaser.Game(800, 600, Phaser.AUTO, "");
     game.state.add("PlayGame",playGame);
     game.state.start("PlayGame");
}

var playGame = function(game){};

playGame.prototype = {
	preload: function(){
          game.load.image("ball", "ball.png");
	},
  	create: function(){
          var launchGraphics = game.add.graphics(0, 0);
          launchGraphics.lineStyle(5, 0xff0000);
          launchGraphics.drawRect(launchRectangle.x, launchRectangle.y, launchRectangle.width, launchRectangle.height);          
          trajectoryGraphics = game.add.graphics(0, 0);          
          launchVelocity = new Phaser.Point(0, 0);
		  game.stage.backgroundColor = "#222222";
		  game.physics.startSystem(Phaser.Physics.BOX2D);
          game.physics.box2d.gravity.y = 500;
          game.input.onDown.add(placeBall);
          crateBody = new Phaser.Physics.Box2D.Body(game, null, 500, 440, 1);
          crateBody.restitution = 0.98;
          crateBody.addRectangle(120, 10, 0, 0);
          crateBody.addRectangle(10, 110, -55, -60);
          crateBody.addRectangle(10, 110, 55, -60);
          var crateTop = crateBody.addRectangle(10, 40, 68, -124, Math.PI / 4);
          crateTop.m_userData = "yukarda";
          crateTop = crateBody.addRectangle(10, 40, -68, -124, -Math.PI / 4);
          crateTop.m_userData = "yukarda";
          var sensor = crateBody.addRectangle(100, 70, 0, -40);
          sensor.m_isSensor = true;
          sensor.m_userData = "icerde";
          crateBody.setCollisionCategory(2);
          crateBody.velocity.x = crateSpeed;
          var barBody = new Phaser.Physics.Box2D.Body(game, null, 350, 300, 0);
          barBody.setRectangle(10, 400, 0, 0);
	},
     render: function(){
          game.debug.box2dWorld();
     },
     update: function(){
          if(crateBody.x > 710){
               crateBody.velocity.x = - crateSpeed;         
          }
          if(crateBody.x < 500){
               crateBody.velocity.x = crateSpeed;         
          }      
     }
}

function placeBall(e){
     if(launchRectangle.contains(e.x, e.y)){
          ball = game.add.sprite(e.x, e.y, "ball");
          game.physics.box2d.enable(ball);
          ball.body.gravityScale = 0;
          ball.body.setCircle(ball.width / 2);
          ball.body.restitution = 0.59;
          game.input.onDown.remove(placeBall);
          game.input.onUp.add(launchBall);
          game.input.addMoveCallback(chargeBall);
     }	
}

function chargeBall(pointer, x, y, down){
     if(pointer.id == 0){
          trajectoryGraphics.clear();
          trajectoryGraphics.lineStyle(1, 0x00ff00);
          trajectoryGraphics.moveTo(ball.x, ball.y);
          if(launchRectangle.contains(x, y)){
               trajectoryGraphics.lineTo(x, y);
               launchVelocity.x = ball.x - x;
               launchVelocity.y = ball.y - y;               
          }
          else{
               var intersection = lineIntersectsRectangle(new Phaser.Line(x, y, ball.x, ball.y), launchRectangle);
               trajectoryGraphics.lineTo(intersection.x, intersection.y);
               launchVelocity.x = ball.x - intersection.x;
               launchVelocity.y = ball.y - intersection.y;
          } 
          trajectoryGraphics.lineStyle(1, 0x00ff00);  
          launchVelocity.multiply(forceMult, forceMult);
          for (var i = 0; i < 180; i += 6){
               var trajectoryPoint = getTrajectoryPoint(ball.x, ball.y, launchVelocity.x, launchVelocity.y, i);
               trajectoryGraphics.moveTo(trajectoryPoint.x - 3, trajectoryPoint.y - 3); 
               trajectoryGraphics.lineTo(trajectoryPoint.x + 3, trajectoryPoint.y + 3);
               trajectoryGraphics.moveTo(trajectoryPoint.x - 3, trajectoryPoint.y + 3);  
               trajectoryGraphics.lineTo(trajectoryPoint.x + 3, trajectoryPoint.y - 3);        
          }     
     }
}

function launchBall(){
     game.input.deleteMoveCallback(0);
     game.input.onUp.remove(launchBall);
     game.input.onDown.add(placeBall);
     ball.body.velocity.x = launchVelocity.x;
     ball.body.velocity.y = launchVelocity.y;
     ball.body.gravityScale = 1;
     ball.body.setCategoryContactCallback(2, ballHitsCrate);     
}

function ballHitsCrate(body1, body2, fixture1, fixture2, begin){ 
     if(begin){ 
          if(fixture2.m_userData == "icerde"){
               body1.restitution = 0;
               body1.setCategoryContactCallback(4, ballHitsCrate);
          }
          if(fixture2.m_userData == "yukarda"){
               body1.sprite.destroy();
          }
     }
}

function lineIntersectsRectangle(l, r){
     return l.intersects(new Phaser.Line(r.left, r.top, r.right, r.top), true) ||
          l.intersects(new Phaser.Line(r.left, r.bottom, r.right, r.bottom), true) ||
          l.intersects(new Phaser.Line(r.left, r.top, r.left, r.bottom), true) ||
          l.intersects(new Phaser.Line(r.right, r.top, r.right, r.bottom), true);
}

function getTrajectoryPoint(startX, startY, velocityX, velocityY, n) {
     var t = 1 / 60;    
     var stepVelocityX = t * game.physics.box2d.pxm(-velocityX); 
     var stepVelocityY = t * game.physics.box2d.pxm(-velocityY);    
     var stepGravityX = t * t * game.physics.box2d.pxm(-game.physics.box2d.gravity.x); 
     var stepGravityY = t * t * game.physics.box2d.pxm(-game.physics.box2d.gravity.y);
     startX = game.physics.box2d.pxm(-startX);
     startY = game.physics.box2d.pxm(-startY);    
     var tpx = startX + n * stepVelocityX + 0.5 * (n * n + n) * stepGravityX;
     var tpy = startY + n * stepVelocityY + 0.5 * (n * n + n) * stepGravityY;    
     tpx = game.physics.box2d.mpx(-tpx);
     tpy = game.physics.box2d.mpx(-tpy);    
     return {
          x: tpx, 
          y: tpy 
     };
}