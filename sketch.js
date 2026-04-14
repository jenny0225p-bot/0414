let seeds = [];
let seaweeds = [];
let osc, env; // 用於合成音效

function setup() {
  let canvas = createCanvas(400, windowHeight);
  canvas.parent('sketch-container');

  // 初始化音效 (水滴聲合成器)
  osc = new p5.Oscillator('sine');
  env = new p5.Envelope();
  env.setADSR(0.01, 0.1, 0.1, 0.1); // 快速啟動與衰減
  env.setRange(0.5, 0);

  // 初始化水草資料，使其具有不同的高度、粗細、搖晃速度與透明度
  for (let i = 0; i < 6; i++) {
    seaweeds.push({
      baseX: random(0, width),
      h: random(height * 0.2, height * 0.45), // 高度為視窗高度的 20%~45%
      w: random(40, 50),                      // 粗細由 40 到 50 間
      speed: random(0.01, 0.04),              // 不同的搖晃速度
      phase: random(TWO_PI),                  // 不同的初始相位
      col: color(46, random(100, 180), 87, random(80, 150)) // 帶有透明度的顏色
    });
  }

  // 建立週次種子 (第一週在底部，第二週在上方)
  // 更新連結至指定目錄
  seeds.push(new Seed(width / 2 - 20, height - 100, "第一週作品", "./week1/0324/0324/", color(144, 238, 144)));
  seeds.push(new Seed(width / 2 + 30, height - 250, "第二週作品", "./week2/0407/0407/", color(255, 182, 193)));
}

function draw() {
  background(20, 24, 35); // 深色背景展現記憶圍欄感

  drawSeaweed(); // 繪製背景海草
  drawVine();    // 繪製生長主脈絡

  // 顯示並更新種子狀態
  for (let seed of seeds) {
    seed.display();
    seed.update();
  }

  drawUI();
}

// 繪製主藤蔓 (生長脈絡)
function drawVine() {
  noFill();
  stroke(50, 150, 80, 180);
  strokeWeight(4);
  beginShape();
  for (let y = height; y > 100; y -= 10) {
    // 使用 sin 讓藤蔓產生波浪律動
    let xOffset = sin(y * 0.01 + frameCount * 0.02) * 30;
    vertex(width / 2 + xOffset, y);
  }
  endShape();
}

// 繪製動態海草點綴
function drawSeaweed() {
  blendMode(BLEND); // 確保顏色重疊時有透明特效
  noFill();
  for (let sw of seaweeds) {
    stroke(sw.col); 
    strokeWeight(sw.w); 
    
    beginShape();
    // curveVertex 需要起始與結束的重複控制點來確保線條顯示
    curveVertex(sw.baseX, height);
    curveVertex(sw.baseX, height);
    
    for (let y = height - 20; y > height - sw.h; y -= 40) {
      // 使用個別的 speed 與 phase 產生不同的擺動
      let sway = sin(y * 0.005 + frameCount * sw.speed + sw.phase) * map(y, height, height - sw.h, 0, 40);
      curveVertex(sw.baseX + sway, y);
    }
    
    let lastY = height - sw.h;
    let lastSway = sin(lastY * 0.005 + frameCount * sw.speed + sw.phase) * 40;
    curveVertex(sw.baseX + lastSway, lastY);
    curveVertex(sw.baseX + lastSway, lastY);
    endShape();
  }
}

function drawUI() {
  fill(255, 150);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text("時光記憶圍欄：點擊花朵探索每週作品", width / 2, 40);
}

function mousePressed() {
  for (let seed of seeds) {
    if (seed.isHovered()) {
      playWaterDrop();
      updateIframe(seed.url);
    }
  }
}

// 合成水滴音效
function playWaterDrop() {
  osc.start();
  osc.freq(800);
  osc.freq(100, 0.2); // 頻率快速滑落產生「噗通」感
  env.play(osc);
  setTimeout(() => osc.stop(), 300);
}

// 更新網頁中的 iframe
function updateIframe(url) {
  let iframe = document.getElementById('assignment-iframe');
  if (iframe) {
    iframe.src = url;
  } else {
    console.log("未找到 iframe，請確認 HTML 中有 id 為 'assignment-iframe' 的元素。連結為: " + url);
  }
}

// 種子與花朵類別
class Seed {
  constructor(x, y, label, url, col) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.url = url;
    this.col = col;
    this.size = 20;
    this.targetSize = 20;
  }

  update() {
    // 動態縮放效果
    if (this.isHovered()) {
      this.targetSize = 40;
    } else {
      this.targetSize = 20;
    }
    this.size = lerp(this.size, this.targetSize, 0.1);
  }

  display() {
    push();
    translate(this.x + sin(this.y * 0.01 + frameCount * 0.02) * 30, this.y);
    
    // 繪製花瓣 (使用 vertex)
    fill(this.col);
    noStroke();
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.2) {
      let r = this.size * (1 + 0.6 * sin(5 * a)); // 五瓣花形
      let vx = r * cos(a);
      let vy = r * sin(a);
      vertex(vx, vy);
    }
    endShape(CLOSE);

    // 文字標籤
    fill(255);
    textSize(14);
    textAlign(CENTER);
    text(this.label, 0, this.size + 20);
    pop();
  }

  isHovered() {
    // 考慮到藤蔓的動態偏移
    let currentX = this.x + sin(this.y * 0.01 + frameCount * 0.02) * 30;
    let d = dist(mouseX, mouseY, currentX, this.y);
    return d < this.size + 10;
  }
}
