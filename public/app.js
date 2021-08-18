const baseURL = "https://www.purgomalum.com/service/plain?text=";
const nickNameDic = [
  "Daniel Warrior",
  "Jackass",
  "Tomuser Politics",
  "Franky Awei",
  "Peter Pitty",
  "David Loser",
  "Jesse J",
];
let barTimers = [];
let gameStarted = false;
let gameTimerId;
let userScore = 0;
let highScore = 0;
let highScoreNickname = "anonymous mongo";
let userNickname;
let userClientId;
let userPublishChannel;
let gameChannel;
let gameChannelName = "flappy-game";
let allBirds = {};
let topScoreChannel;
let topScoreChannelName = "flappy-top-score";

if (localStorage.getItem("flappy-nickname")) {
  myNickname = localStorage.getItem("flappy-nickname");
} else {
  myNickname = nickNamesDictionary[Math.floor(Math.random() * 34)];
  localStorage.setItem("flappy-nickname", myNickname);
}

const realtime = new Ably.Realtime({
  authUrl: "/auth",
});

document.addEventListener("DOMContentLoaded", () => {
  const sky = document.querySelector(".sky");
  const bird = document.querySelector(".bird");
  const gameContainer = document.querySelector(".game-container");
  const ground = document.querySelector(".ground");

  let nicknameInput = document.getElementById("nickname-input");
  let updateNicknameBtn = document.getElementById("update-nickname");
  let scoreLabel = document.getElementById("score-label");
  let topScoreLabel = document.getElementById("top-label");
  let scoreList = document.getElementById("score-list");

  let birdLeft = 220;
  let birdBottom = 200;
  let gravity = 2;
  let isGameover = false;
  let interval = 440;
  let topBarBottom = 0;

  const filterNickname = async (nicknameText) => {
    const http = new XMLHttpRequest();
    let encodedText = encodeURIComponent(nicknameText);
    http.open("GET", profanityBaseURL + encodedText + "&fill_text=***");
    http.send();
    http.onload = () => {
      myNickname = http.responseText;
      nicknameInput.value = myNickname;
      localStorage.setItem("flappy-nickname", myNickname);
    };
  };

  topScoreLabel.innerHTML =
    "Top score - " + highScore + "pts by " + highScoreNickname;
  nicknameInput.value = myNickname;
  updateNicknameBtn.addEventListener("click", () => {
    filterNickname(nicknameInput.value);
  });

  window.addEventListener("keydown", function (e) {
    if (e.keyCode == 32 && e.target == document.body) {
      e.preventDefault();
    }
  });

  realtime.connection.once("connected", () => {
    myClientId = realtime.auth.clientId;
    myPublishChannel = realtime.channels.get("bird-position-" + myClientId);
    topScoreChannel = realtime.channels.get(topScoreChannelName, {
      params: { rewind: 1 },
    });
    topScoreChannel.subscribe((msg) => {
      highScore = msg.data.score;
      highScoreNickname = msg.data.nickname;
      topScoreLabel.innerHTML =
        "Top score - " + highScore + "pts by " + highScoreNickname;
      topScoreChannel.unsubscribe();
    });
    gameChannel = realtime.channels.get(gameChannelName);
    gameDisplay.onclick = function () {
      if (!gameStarted) {
        gameStarted = true;
        gameChannel.presence.enter({
          nickname: myNickname,
        });
        sendPositionUpdates();
        showOtherBirds();
        document.addEventListener("keyup", control);
        gameTimerId = setInterval(startGame, 20);
      }
    };
  });

  function jump() {
    birdBottom += 50;
    bird.style.bottom = birdBottom + "px";
    bird.style.left = birdLeft + "px";
    console.log(birdBottom);
  }
  function startGame() {
    birdBottom -= gravity;
    bird.style.bottom = birdBottom + "px";
    bird.style.left = birdLeft + "px";
    for (item in allBirds) {
      if (allBirds[item].targetBottom) {
        let tempBottom = parseInt(allBirds[item].el.style.bottom);
        tempBottom += (allBirds[item].targetBottom - tempBottom) * 0.5;
        allBirds[item].el.style.bottom = tempBottom + "px";
      }
    }
  }

  function controlKey(e) {
    if (e.keyCode === 32 && !isGameover) {
      jump();
    }
  }
  function generateBars() {
    if (!isGameover) {
      let barLeft = 500;
      let randomHeight = Math.random() * 60;
      let barBottom = randomHeight;
      topBarBottom = barBottom + interval;

      const bar = document.createElement("div");
      const topBar = document.createElement("div");

      bar.classList.add("bar");
      topBar.classList.add("topBar");

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

        if (barLeft === 220) {
          userScore++;
          setTimeout(() => {
            sortLeaderBoard();
          }, 400);
        }

        if (barLeft === -50) {
          clearInterval(timeBar);
          gameContainer.removeChild(bar);
          gameContainer.removeChild(topBar);
        }
        if (
          (barLeft > 200 &&
            barLeft < 280 &&
            birdLeft === 220 &&
            (birdBottom < barBottom + 210 ||
              birdBottom > topBarBottom - 150)) ||
          birdBottom === 0
        ) {
          for (timer in barTimers) {
            clearInterval(barTimers[timer]);
          }
          sortLeaderBoard();
          gameover();
        }
      }

      let timeBar = setInterval(moveBar, 20);
      setTimeout(generateBars, 3500);
    }
  }
  function gameover() {
    scoreLabel.innerHTML += " | Game Over";
    clearInterval(timeGame);
    isGameover = true;
    document.removeEventListener("keyup", controlKey);
    ground.classList.add("ground");
    ground.classList.remove("ground-moving");
    realtime.connection.close();
  }
  function sendPositionUpdates() {
    let publishTimer = setInterval(() => {
      userPublishChannel.publish("pos", {
        bottom: parseInt(bird.style.bottom),
        nickname: userNickname,
        score: userScore,
      });
      if (isGameOver) {
        clearInterval(publishTimer);
        userPublishChannel.detach();
      }
    }, 100);
  }

  function showOtherBirds() {
    gameChannel.subscribe("game-state", (msg) => {
      for (let item in msg.data.birds) {
        if (item != userClientId) {
          let newBottom = msg.data.birds[item].bottom;
          let newLeft = msg.data.birds[item].left;
          let isDead = msg.data.birds[item].isDead;
          if (allBirds[item] && !isDead) {
            allBirds[item].targetBottom = newBottom;
            allBirds[item].left = newLeft;
            allBirds[item].isDead = msg.data.birds[item].isDead;
            allBirds[item].nickname = msg.data.birds[item].nickname;
            allBirds[item].score = msg.data.birds[item].score;
          } else if (allBirds[item] && isDead) {
            sky.removeChild(allBirds[item].el);
            delete allBirds[item];
          } else {
            if (!isGameOver && !isDead) {
              allBirds[item] = {};
              allBirds[item].el = document.createElement("div");
              allBirds[item].el.classList.add("other-bird");
              sky.appendChild(allBirds[item].el);
              allBirds[item].el.style.bottom = newBottom + "px";
              allBirds[item].el.style.left = newLeft + "px";
              allBirds[item].isDead = msg.data.birds[item].isDead;
              allBirds[item].nickname = msg.data.birds[item].nickname;
              allBirds[item].score = msg.data.birds[item].score;
            }
          }
        } else if (item == userClientId) {
          allBirds[item] = msg.data.birds[item];
        }
      }
      if (msg.data.highScore > highScore) {
        highScore = msg.data.highScore;
        highScoreNickname = msg.data.highScoreNickname;
        topScoreLabel.innerHTML =
          "Top score - " + highScore + "pts by " + highScoreNickname;
      }
      if (msg.data.launchbar == true && !isGameOver) {
        generatebars(msg.data.barHeight);
      }
    });
  }

  function sortLeaderboard() {
    scoreLabel.innerHTML = "Score: " + userScore;
    let listItems = "";
    let leaderBoard = new Array();
    for (let item in allBirds) {
      leaderBoard.push({
        nickname: allBirds[item].nickname,
        score: allBirds[item].score,
      });
    }
    leaderBoard.sort((a, b) => {
      b.score - a.score;
    });
    leaderBoard.forEach((bird) => {
      listItems +=
        "<li class='score-item'><span class='name'>" +
        bird.nickname +
        "</span><span class='points'>" +
        bird.score +
        "pts</span></li>";
    });
    scoreList.innerHTML = listItems;
  }
});
