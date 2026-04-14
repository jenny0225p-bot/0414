let seaweeds = [];
let fishes = [];
let bubbles = [];
let popSound;
let soundEnabled = false;

function preload() {
  popSound = loadSound('pop.mp3');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0); // 確保畫布位置固定在左上角
  cnv.style('pointer-events', 'none'); // 讓滑鼠點擊穿透 Canvas，以便操作下方的 iframe
  cnv.style('z-index', '1'); // 將 Canvas 置於 iframe 上層 (視覺上)

  let iframe = createElement('iframe');
  iframe.position(0, 0);
  iframe.size(windowWidth, windowHeight);
  iframe.attribute('src', 'https://www.et.tku.edu.tw/');
  iframe.style('border', 'none');

  let colors = ['#d4bfee', '#eba4ce', '#fff4ac', '#c3f0ff', '#aafff4'];
  for (let i = 0; i < 80; i++) {
    seaweeds.push(new Seaweed(colors));
  }
  for (let i = 0; i < 10; i++) {
    fishes.push(new Fish());
  }
}

function draw() {
  clear(); // 清除上一幀的畫面，確保透明度不會疊加成不透明
  background(209, 229, 255, 76); // 背景色 #d1e5ff (209, 229, 255)，透明度 0.3 (約 76)
  blendMode(BLEND); // 設定混合模式為 BLEND，配合透明度產生重疊效果
  for (let seaweed of seaweeds) {
    seaweed.display();
  }

  for (let fish of fishes) {
    fish.update();
    fish.display();
  }

  // 隨機產生泡泡
  if (random(1) < 0.03) {
    bubbles.push(new Bubble());
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isDead()) {
      bubbles.splice(i, 1);
    }
  }
}

function mousePressed() {
  if (!soundEnabled) {
    soundEnabled = true;
    userStartAudio(); // 確保瀏覽器音訊環境被啟動
  }
}

class Seaweed {
  constructor(colors) {
    this.x = random(width);
    this.color = color(random(colors)); // 將顏色字串轉為 p5.Color 物件
    this.color.setAlpha(150);           // 設定透明度 (0-255)，讓水草重疊時能透出顏色
    this.heightScale = random(0.20, 0.45); // 高度 20%~45%
    this.thickness = random(20, 30);       // 粗細 20~30，讓底部變細
    this.speed = random(0.002, 0.008);     // 搖晃速度不一
    this.noiseOffset = random(1000);       // 隨機偏移，確保每株搖晃不同
  }

  display() {
    fill(this.color);
    noStroke();

    let topY = height - (height * this.heightScale);

    beginShape();
    
    // 起始控制點：讓底部的曲線起始更穩定
    curveVertex(this.x - this.thickness, height);
    
    // 左側邊緣：從底部往上畫
    for (let y = height; y >= topY; y -= 5) {
      let level = map(y, height, topY, 0, 1);
      let n = noise(y * 0.003, frameCount * this.speed + this.noiseOffset);
      let xCenter = this.x + map(n, 0, 1, -120, 120) * level;
      let w = this.thickness; // 改為等寬，呈現圓柱狀
      curveVertex(xCenter - w, y);
    }

    // 頂端圓弧處理：計算頂端中心點並加上一個凸出的頂點，形成圓頭
    let nTop = noise(topY * 0.003, frameCount * this.speed + this.noiseOffset);
    let xTop = this.x + map(nTop, 0, 1, -120, 120);
    let wTop = this.thickness;

    // 增加頂部圓弧的頂點，讓形狀更圓潤
    curveVertex(xTop - wTop * 0.6, topY - wTop * 0.6);
    curveVertex(xTop, topY - wTop);
    curveVertex(xTop + wTop * 0.6, topY - wTop * 0.6);

    // 右側邊緣：從頂部往下畫
    for (let y = topY; y <= height; y += 5) {
      let level = map(y, height, topY, 0, 1);
      let n = noise(y * 0.003, frameCount * this.speed + this.noiseOffset);
      let xCenter = this.x + map(n, 0, 1, -120, 120) * level;
      let w = this.thickness;
      curveVertex(xCenter + w, y);
    }
    
    // 結束控制點：讓底部的曲線封閉更自然
    curveVertex(this.x + this.thickness, height);

    endShape(CLOSE);
  }
}

class Fish {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.2, height * 0.8);
    this.size = random(20, 40);
    this.speed = random(1, 3);
    this.color = color(random(255), random(100, 200), random(100));
    this.direction = random() > 0.5 ? 1 : -1;
  }

  update() {
    this.x += this.speed * this.direction;
    if (this.x > width + 50) this.x = -50;
    if (this.x < -50) this.x = width + 50;
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.direction, 1);
    noStroke();
    fill(this.color);
    ellipse(0, 0, this.size, this.size * 0.6); // 魚身
    triangle(-this.size * 0.4, 0, -this.size * 0.8, -this.size * 0.3, -this.size * 0.8, this.size * 0.3); // 尾巴
    fill(255);
    circle(this.size * 0.2, -this.size * 0.1, this.size * 0.2); // 眼睛
    fill(0);
    circle(this.size * 0.25, -this.size * 0.1, this.size * 0.08); // 眼珠
    pop();
  }
}

class Bubble {
  constructor() {
    this.x = random(width);
    this.y = height + 10;
    this.size = random(10, 20);
    this.speed = random(1, 3);
    this.popHeight = random(height * 0.2, height * 0.6); // 隨機破掉的高度
    this.popping = false;
    this.popTimer = 10; // 破掉效果維持的幀數
  }

  update() {
    if (!this.popping) {
      this.y -= this.speed;
      if (this.y < this.popHeight) {
        this.popping = true;
        if (soundEnabled) {
          popSound.play();
        }
      }
    } else {
      this.popTimer--;
    }
  }

  display() {
    if (!this.popping) {
      noStroke();
      fill(255, 127); // 白色，透明度 0.5 (255 * 0.5 ≈ 127)
      circle(this.x, this.y, this.size);
      fill(255, 204); // 高光，透明度 0.8 (255 * 0.8 ≈ 204)
      circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
    } else if (this.popTimer > 0) {
      stroke(255);
      strokeWeight(2);
      noFill();
      // 破裂效果：畫出放射狀線條
      for (let i = 0; i < 6; i++) {
        let angle = TWO_PI / 6 * i;
        let r1 = this.size * 0.5;
        let r2 = this.size;
        line(this.x + cos(angle) * r1, this.y + sin(angle) * r1, this.x + cos(angle) * r2, this.y + sin(angle) * r2);
      }
    }
  }

  isDead() {
    return this.popping && this.popTimer <= 0;
  }
}
