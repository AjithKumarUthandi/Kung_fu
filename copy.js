//this object for sound
function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function () {
    this.sound.play();
  };
  this.stop = function () {
    this.sound.pause();
  };
}

let sounds = {
  kick: new sound("audio/kick.wav"),
  punch: new sound("audio/punch.mp3"),
  block: new sound("audio/block.mp3"),
  movement: new sound("audio/movement.mp3"),
  pain: new sound("audio/pain.wav"),
  win: new sound("audio/win.wav"),
  p1win: new sound("audio/p1style.wav"),
  p2win: new sound("audio/p2style.wav"),
};

let c = document.getElementById("my-canvas");
let ctx = c.getContext("2d");

//Text
ctx.font = "30px Arial";
ctx.fillText("FIGHT", 550, 50);

//Health reader intialize
ctx.beginPath();
//This rectangles are border
ctx.rect(40, 29, 500, 20);
ctx.rect(650, 29, 500, 20);
//This rectangle are health player have
ctx.fillStyle = "Green";
ctx.fillRect(40, 29, 500, 18); //P1
ctx.fillRect(650, 29, 500, 18); //P2

ctx.stroke();

//load image
let setImg = (imgName, callback) => {
  let img = document.createElement("img");
  img.onload = () => callback(img);

  img.src = imgName;
};

//set image path
let imagePath = (imgName, imgNo, anim) => {
  return "images/" + imgName + anim + "/" + imgNo + ".png";
};

//each position image count
let frames = {
  idle: [1, 2, 3, 4, 5, 6, 7, 8],
  kick: [1, 2, 3, 4, 5, 6, 7],
  punch: [1, 2, 3, 4, 5, 6, 7],
  forward: [1, 2, 3, 4, 5, 6],
  backward: [1, 2, 3, 4, 5, 6],
  block: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

//game loaded
let loadImages = (imgName, callback) => {
  let images = {
    idle: [],
    kick: [],
    punch: [],
    forward: [],
    backward: [],
    block: [],
  };
  let imagesToLoad = 0;

  ["idle", "kick", "punch", "forward", "backward", "block"].forEach(
    (animation) => {
      let animationFrames = frames[animation];
      imagesToLoad += animationFrames.length;

      animationFrames.forEach((frameNumber) => {
        let path = imagePath(imgName, frameNumber, animation);

        setImg(path, (image) => {
          images[animation][frameNumber - 1] = image;
          imagesToLoad -= 1;

          if (imagesToLoad === 0) {
            callback(images);
          }
        });
      });
    }
  );
};

class Player {
  constructor(x, width, height) {
    // position Xaxis, imgwidth, imgheight, imagename, player animation queued and oppenentHealth
    this.x = x;
    this.width = width;
    this.height = height;
    this.imgName = "";
    this.queuedAnim = [];
    this.opponentHealth = 100;
  }

  gameStart = (opp) => {
    let selectAnim = [];
    loadImages(this.imgName, (images) => {
      let aux = () => {
        //run next animation
        //player1
        if (this.queuedAnim.length === 0) {
          selectAnim[0] = "idle";
        } else {
          selectAnim[0] = this.queuedAnim.shift();
        }
        //player2
        if (opp.queuedAnim.length === 0) {
          selectAnim[1] = "idle";
        } else {
          selectAnim[1] = opp.queuedAnim.shift();
        }

        //checking next animation either forward or backward and run the statement from the input
        //player1
        if (
          (detection() && selectAnim[0] == "forward") ||
          selectAnim[0] == "backward"
        ) {
          this.movement(selectAnim[0]);
        }
        //player2
        if (
          selectAnim[1] == "forward" ||
          (detection() && selectAnim[1] == "backward")
        ) {
          p2.movement(selectAnim[1]);
        }

        //both player1 and player 2 animation runs here
        this.animate(ctx, images, selectAnim, aux);

        //checking next animation either kick,puch or block and run the statement from the input
        //player1
        this.punchOrKick(selectAnim[0], selectAnim[1] == "block");
        //player2
        p2.punchOrKick(selectAnim[1], selectAnim[0] == "block");
      };
      aux();
    });
  };

  //Movement animation(forward and backward).
  //And also controll a movement space limit
  movement = (selectAnimation) => {
    if (selectAnimation == "forward" && this.x < c.width) {
      sounds.movement.play();
      this.x += 50;
    } else if (selectAnimation == "backward" && this.x != 0) {
      sounds.movement.play();
      this.x -= 50;
    }
  };

  //Statement for punch,kick and block
  //Mostly used for punch and kick
  punchOrKick = (selectAnimation, isBlocked) => {
    if (
      !isBlocked &&
      (selectAnimation == "punch" || selectAnimation == "kick")
    ) {
      let x = getDamage(this == p1, selectAnimation); //Find the damage is happened? and reduce the opponent health

      //If one who first lose total health, then end this game
      if (x != 0) {
        this.opponentHealth -= x;
        healthAnim(this == p1, (100 - this.opponentHealth) / 10);
        if (this.opponentHealth <= 0) {
          finish(this == p1);
        }
      }
    } else {
      //if opponent blocked, didn't get damage
      if (isBlocked) sounds.block.play();
    }
  };

  //both player animation are darw by a same time
  animate = (ctx, images, animation, callback) => {
    //Below code,use for Find who have more animation images.
    let p1AnimLen = images[animation[0]].length;
    let p2AnimLen = images[animation[1]].length;
    images[animation[p1AnimLen < p2AnimLen ? 1 : 0]].forEach((image, index) => {
      setTimeout(() => {
        ctx.clearRect(0, 50, 2000, this.height); //clear the canvas with the help of the players size

        //If any one animation is over before other player animtion .
        //then, stop those player draw image.
        //for player1
        if (p1AnimLen > index)
          ctx.drawImage(
            images[animation[0]][index],
            this.x,
            50,
            this.width,
            this.height
          );

        //for player2

        if (p2AnimLen > index) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            images[animation[1]][index],
            p2.x * -1,
            50,
            p2.width,
            p2.height
          );
          ctx.restore();
        }
      }, index * 100);
    });

    setTimeout(
      callback,
      images[animation[p1AnimLen < p2AnimLen ? 1 : 0]].length * 70
    );
  };
}

//checking collision detection
let detection = () => {
  if (p2.x - p1.x > 400) {
    return true;
  } else {
    return false;
  }
};

//health rador
let getDamage = (obj, attackingMethod) => {
  let isAttacked = false;
  if (obj) {
    isAttacked = attackFrom(p1, p2);
  } else {
    isAttacked = attackFrom(p1, p2);
  }

  if (isAttacked) {
    if (attackingMethod == "kick") {
      sounds.kick.play();
      sounds.pain.play();
      return 10;
    } else {
      sounds.punch.play();
      sounds.pain.play();
      return 5;
    }
  } else {
    return 0;
  }
};

//is attacking happen p1 vs p2
let attackFrom = (a, b) => {
  if (a.x >= b.x - 400) {
    return true;
  } else {
    return false;
  }
};

//health animation
function healthAnim(obj, reduc) {
  let reduction = 50 * reduc;
  if (reduction >= 400) {
    ctx.fillStyle = "red";
  } else {
    ctx.fillStyle = "Green";
  }
  if (obj) {
    ctx.clearRect(650, 29, 500, 18);
    ctx.fillRect(650, 29, 500 - reduction, 18);
  } else {
    ctx.clearRect(40, 29, 500, 18);
    ctx.fillRect(40 + reduction, 29, 500 - reduction, 18);
  }
}

//The end of the game
function finish(obj) {
  sounds.win.play();
  let winner;
  if (obj) {
    sounds.p1win.play();
    winner = "Player1 win!!!";
  } else {
    sounds.p2win.play();
    winner = "Player2 win!!!";
  }
  setTimeout(() => {
    alert(winner);
    ctx = null;
    location.reload();
  }, 100);
}

let p1 = new Player(0, 300, 500);

let p2 = new Player(1200, 300, 500);

p1.gameStart(p2);

//game mouse controllers
// player1
function p1Reader(reader) {
  p1.queuedAnim.push(reader);
}
// player2
function p2Reader(reader) {
  p2.queuedAnim.push(reader);
}

//key board controller
document.addEventListener("keyup", (event) => {
  const key = event.key;

  switch (key) {
    //Player1
    case "a":
    case "A":
      p1.queuedAnim.push("backward");
      break;
    case "d":
    case "D":
      p1.queuedAnim.push("forward");
      break;
    case "z":
    case "Z":
      p1.queuedAnim.push("kick");
      break;
    case "x":
    case "X":
      p1.queuedAnim.push("punch");
      break;
    case "b":
    case "B":
      p1.queuedAnim.push("block");
      break;

    //player2
    case "ArrowLeft":
      p2.queuedAnim.push("backward");
      break;
    case "ArrowRight":
      p2.queuedAnim.push("forward");
      break;
    case "n":
    case "N":
      p2.queuedAnim.push("kick");
      break;
    case "M":
    case "m":
      p2.queuedAnim.push("punch");
      break;
    case "l":
    case "L":
      p2.queuedAnim.push("block");
      break;
  }
});
