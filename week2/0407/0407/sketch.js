let points = [];
let gameState = "START"; // 狀態: START, PLAYING, WIN, FAIL
let numPoints = 10; // 增加到 10 個點
let winCount = 0;   // 追蹤通關次數

// 視覺效果變數
let shakeAmount = 0;
let flashAlpha = 0;
let flashColor;
let fireworks = [];
let effectTriggered = false;

// 背景電子粒子
let bgParticles = [];

function setup() {
  createCanvas(windowWidth, windowHeight); // 改為全螢幕
  generatePath();
  flashColor = color(255, 255, 255);

  // 初始化背景粒子
  for (let i = 0; i < 50; i++) {
    bgParticles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      size: random(1, 3)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath(); // 重新調整路徑位置
}

function generatePath() {
  points = [];
  let startX = 60;
  let spacing = (width - 120) / (numPoints - 1);

  // 將通道寬度調寬，設定在 40 到 80 之間
  let minGap = 40;
  let maxGap = 80;

  for (let i = 0; i < numPoints; i++) {
    let x = startX + i * spacing;
    let yTop = random(height * 0.2, height * 0.7); // 根據螢幕高度動態分布
    let gap = random(minGap, maxGap); 
    let yBottom = yTop + gap;
    points.push({ x, yTop, yBottom });
  }
}

function draw() {
  // 畫面震動處理
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; // 震動衰減
  }

  background(20, 20, 30); // 深色背景更有科技感

  // 繪製背景裝飾
  updateBackgroundParticles();
  drawGrid();

  if (gameState === "START") {
    effectTriggered = false;
    drawPath();
    // 開始按鈕：動態對齊路徑開口
    let startP = points[0];
    fill(0, 150, 255);
    rect(10, startP.yTop, 40, startP.yBottom - startP.yTop);
    fill(255);
    textAlign(CENTER, CENTER);
    text("START", 30, (startP.yTop + startP.yBottom) / 2);

    if (mouseIsPressed && mouseX > 10 && mouseX < 50 && mouseY > startP.yTop && mouseY < startP.yBottom) {
      gameState = "PLAYING";
    }
  } else if (gameState === "PLAYING") {
    drawPath();
    checkCollision();
    
    // 繪製玩家位置指示
    fill(255, 255, 0);
    stroke(255, 255, 0, 150);
    strokeWeight(10);
    ellipse(mouseX, mouseY, 6, 6);
    strokeWeight(1);
  } else if (gameState === "WIN") {
    triggerWinEffects();
    updateFireworks();
    displayEndScreen("SUCCESS!", color(0, 150, 0));
  } else if (gameState === "FAIL") {
    triggerFailEffects();
    displayEndScreen("GAME OVER", color(200, 0, 0));
  }

  // 繪製閃光層
  if (flashAlpha > 0) {
    noStroke();
    flashColor.setAlpha(flashAlpha);
    fill(flashColor);
    rect(-100, -100, width + 200, height + 200);
    flashAlpha -= 10;
  }
}

function drawPath() {
  let pulse = sin(frameCount * 0.1) * 2; // 增加光暈的呼吸脈動感

  // 繪製多層次擴散光暈 (Bloom Effect)，模擬霓虹發光質感
  for (let i = 5; i > 0; i--) {
    stroke(0, 255, 255, 30); // 低透明度的青色
    strokeWeight(i * 7 + pulse);
    renderLines();
  }

  // 霓虹燈管的主色調 (中間飽和層)
  stroke(0, 255, 255);
  strokeWeight(3);
  renderLines();

  // 最核心的高亮白光，強化光線的視覺衝擊
  stroke(220, 255, 255);
  strokeWeight(1);
  renderLines();

  // 繪製終點區域
  let last = points[points.length - 1];
  fill(255, 255, 0, 50 + sin(frameCount * 0.1) * 50);
  noStroke();
  rect(last.x, last.yTop - 20, 40, (last.yBottom - last.yTop) + 40);
  fill(255, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(12);
  text("GOAL", last.x + 20, last.yTop - 30);
}

function renderLines() {
  noFill();
  if (points.length < 2) return;

  // 上邊界曲線
  beginShape();
  // curveVertex 需要第一個點重複作為起始控制點
  curveVertex(points[0].x, points[0].yTop);
  for (let p of points) {
    curveVertex(p.x, p.yTop);
  }
  // 重複最後一個點作為結束控制點
  curveVertex(points[points.length - 1].x, points[points.length - 1].yTop);
  endShape();

  // 下邊界曲線
  beginShape();
  curveVertex(points[0].x, points[0].yBottom);
  for (let p of points) {
    curveVertex(p.x, p.yBottom);
  }
  curveVertex(points[points.length - 1].x, points[points.length - 1].yBottom);
  endShape();
}

function checkCollision() {
  // 檢查是否到達終點
  if (mouseX > points[points.length - 1].x) {
    gameState = "WIN";
    return;
  }

  // 只有當滑鼠在路徑範圍內才檢查碰撞
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];
    if (mouseX >= p1.x && mouseX <= p2.x) {
      let t = (mouseX - p1.x) / (p2.x - p1.x);
      let currentTop = lerp(p1.yTop, p2.yTop, t);
      let currentBottom = lerp(p1.yBottom, p2.yBottom, t);
      if (mouseY <= currentTop || mouseY >= currentBottom) {
        gameState = "FAIL";
      }
    }
  }
  
  // 如果在進入路徑前（按鈕區），滑鼠高度超出了第一點的範圍也算失敗
  let startP = points[0];
  if (mouseX < startP.x && (mouseY <= startP.yTop || mouseY >= startP.yBottom)) {
    gameState = "FAIL";
  }
}

function displayEndScreen(msg, txtColor) {
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255);
  // 文字外框
  stroke(txtColor);
  strokeWeight(4);
  text(msg, width / 2, height / 2);
  noStroke();
  textSize(16);
  text("Click to Restart", width / 2, height / 2 + 50);
  if (mouseIsPressed) {
    generatePath();
    fireworks = [];
    gameState = "START";
  }
}

function triggerWinEffects() {
  if (!effectTriggered) {
    winCount++; // 成功通關，增加難度計數
    shakeAmount = 15;
    flashAlpha = 200;
    flashColor = color(0, 255, 0);
    // 初始化煙火粒子
    for (let i = 0; i < 100; i++) {
      fireworks.push({
        x: width / 2,
        y: height / 2,
        vx: random(-5, 5),
        vy: random(-10, 2),
        c: color(random(255), random(255), random(255)),
        alpha: 255
      });
    }
    effectTriggered = true;
  }
}

function triggerFailEffects() {
  if (!effectTriggered) {
    shakeAmount = 25;
    flashAlpha = 255;
    flashColor = color(255, 0, 0);
    effectTriggered = true;
  }
}

function updateFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // 重力
    p.alpha -= 4;
    noStroke();
    p.c.setAlpha(p.alpha);
    fill(p.c);
    ellipse(p.x, p.y, 4, 4);
    if (p.alpha <= 0) fireworks.splice(i, 1);
  }
}

function updateBackgroundParticles() {
  noStroke();
  fill(0, 255, 255, 50); // 低透明度青色
  for (let p of bgParticles) {
    // 移動
    p.x += p.vx;
    p.y += p.vy;

    // 邊界循環
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // 繪製粒子
    rect(p.x, p.y, p.size, p.size);
  }
}

function drawGrid() {
  stroke(255, 255, 255, 20);
  strokeWeight(1);
  for (let i = 0; i < width; i += 40) line(i, 0, i, height);
  for (let j = 0; j < height; j += 40) line(0, j, width, j);
}
