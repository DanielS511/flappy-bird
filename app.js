document.addEventListener("DOMContentLoaded", () => {
  const bird = document.querySelector(".bird");
  const gameContainer = document.querySelector(".game-container");
  const ground = document.querySelector(".ground");

  let birdLeft = 220;
  let birdBottom = 200;
  let gravity = 2;
  let isGameover = false;
  let interval = 430;
  let topBarBottom = 0;

  function startGame() {
    birdBottom -= gravity;
    bird.style.bottom = birdBottom + "px";
    bird.style.left = birdLeft + "px";
  }
  function controlKey(e) {
    if (e.keyCode === 38) {
      jump();
    }
  }

  let timeGame = setInterval(startGame, 20);

  function jump() {
    if (birdBottom < 500) {
      if (birdBottom + 50 > topBarBottom - 196) {
        birdBottom = topBarBottom - 190;
      } else {
        birdBottom += 50;
      }
    }
    bird.style.bottom = birdBottom + "px";
    bird.style.left = birdLeft + "px";
    console.log(birdBottom);
  }

  document.addEventListener("keyup", controlKey);

  function generateBars() {
    let barLeft = 440;

    let randomHeight = Math.random() * 60;
    let barBottom = randomHeight;
    topBarBottom = barBottom + interval;

    const bar = document.createElement("div");
    const topBar = document.createElement("div");

    if (!isGameover) {
      bar.classList.add("bar");
      topBar.classList.add("topBar");
    }

    gameContainer.appendChild(bar);
    gameContainer.appendChild(topBar);

    bar.style.left = barLeft + "px";
    topBar.style.left = barLeft + "px";
    bar.style.bottom = barBottom + "px";
    topBar.style.bottom = topBarBottom + "px";

    function moveBar() {
      barLeft -= 2;

      bar.style.left = barLeft + "px";
      topBar.style.left = barLeft + "px";

      if (barLeft === -55) {
        clearInterval(timeBar);
        gameContainer.removeChild(bar);
        gameContainer.removeChild(topBar);
      }
      if (
        barLeft > 160 &&
        barLeft < 280 &&
        birdLeft === 220 &&
        (birdBottom < barBottom + 153 || birdBottom > topBarBottom - 196)
      ) {
        clearInterval(timeBar);
        gameover();
      }
      if (birdBottom === 0) {
        clearInterval(timeBar);
        gameover();
      }
    }
    let timeBar = setInterval(moveBar, 20);
    if (!isGameover) setTimeout(generateBars, 3500);
  }
  generateBars();

  function gameover() {
    console.log("game over");
    clearInterval(timeGame);
    isGameover = true;
    document.removeEventListener("keyup", controlKey);
  }
});
