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
let setimg = (imgname, callback) => {
  let img = document.createElement("img");
  img.onload = () => callback(img);

  img.src = imgname;
};

//set image path
let imagePath = (imgname, imgno, anim) => {
  return "images/" + imgname + anim + "/" + imgno + ".png";
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
let loadimages = (imgname, callback) => {
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
        let path = imagePath(imgname, frameNumber, animation);

        setimg(path, (image) => {
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
  constructor(x, width, height, imgname) {
    // position, imgwidth, imgheight, imagepath&name, flip
    this.x = x;
    this.width = width;
    this.height = height;
    this.imgname = imgname;
    this.queuedAnim = [];
    this.opponenthealth = 100;
    this.selectAnim = "";

    loadimages(this.imgname, (images) => {
      let aux = () => {
        //animation
        if (this.queuedAnim.length === 0) {
          this.selectAnim = "idle";
        } else {
          this.selectAnim = this.queuedAnim.shift();
        }

        //Movement
        let move = true;
        if (this.selectAnim == "forward" && this.x < 1000) {
          if (this == p1) if (!detection(true)) move = false; //if player1 close to player2, then stop forward to p2
          if (move) this.x += 50;
        } else if (this.selectAnim == "backward" && this.x != -100) {
          if (this == p2) if (!detection(false)) move = false; //if player2 close to player1, then stop forward to p1
          if (move) this.x -= 50;
        }

        //animation
        this.animate(ctx, images, this.selectAnim, aux);

        //checking hit
        if (this.selectAnim == "punch" || this.selectAnim == "kick") {
          let x = checkhealth(this == p1, this.selectAnim);
          //if hit
          if (x != 0) {
            this.opponenthealth -= x;
            healthanim(this == p1, (100 - this.opponenthealth) / 10);
            if (this.opponenthealth <= 0) {
              finish(this == p1);
            }
          }
        }
      };
      aux();
    });
  }

  //each animation happening here
  animate = (ctx, images, animation, callback) => {
    images[animation].forEach((image, index) => {
      setTimeout(() => {
        if (!detection(false)) {
          //if both players are very close , the both player have same clearRect()
          ctx.clearRect(this.x, 50, 2000, this.height);
        } else {
          //each player have diffrent clearRect()
          ctx.clearRect(this.x, 50, this.width, this.height);
        }
        ctx.drawImage(image, this.x, 50, this.width, this.height);
      }, index * 100);
    });

    setTimeout(callback, images[animation].length * 100);
  };
}

//detection
let detection = (obj) => {
  if (obj && p1.x < p2.x - 100) {
    return true;
  } else if (p1.x + 100 < p2.x) {
    return true;
  } else {
    return false;
  }
};

//healthreader
let checkhealth = (obj, attackingMethod) => {
  let isattacked = false;
  let isoppblock;
  if (obj) {
    isoppblock = p2.selectAnim == "block";
    isattacked = attackfrom(p1, p2);
  } else {
    isoppblock = p1.selectAnim == "block";
    isattacked = attackfrom(p1, p2);
  }

  if (isattacked) {
    if (isoppblock) {
      return 2;
    } else if (attackingMethod == "kick") return 10;
    else return 5;
  } else {
    return 0;
  }
};

//is attacking happen p1 vs p2
let attackfrom = (a, b) => {
  if (a.x >= b.x - 100) {
    return true;
  } else {
    return false;
  }
};

//health animation
function healthanim(obj, reduc) {
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
  // ctx.stroke();
}

//end
function finish(obj) {
  if (obj) alert("Player1 win!!!", 550, 500);
  else alert("Player2 win!!!", 550, 500);
  ctx = null;
  location.reload();
}

let p1 = new Player(0, 300, 500, "");

let p2 = new Player(800, 300, 500, "opp/");

//game mouse controllers
// player1
function p1Reader(reader) {
  p1.queuedAnim.push(reader);
}
// player2
function p2Reader(reader) {
  p2.queuedAnim.push(reader);
}

//key board controllers
//Player1
document.addEventListener("keyup", (event) => {
  const key = event.key;

  switch (key) {
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
  }
});

//player2
document.addEventListener("keyup", (event) => {
  const key = event.key;

  switch (key) {
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
