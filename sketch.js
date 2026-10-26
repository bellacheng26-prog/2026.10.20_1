// Data for the 6 Moods
const moodData = [
  { id: 1, name: "高興", sub: "Happy", type: "happy" },
  { id: 2, name: "悲傷", sub: "Sad", type: "sad" },
  { id: 3, name: "憤怒", sub: "Angry", type: "angry" },
  { id: 4, name: "害羞", sub: "Shy", type: "shy" },
  { id: 5, name: "緊張", sub: "Nervous", type: "nervous" },
  { id: 6, name: "疲倦", sub: "Tired", type: "tired" }
];

let questions = [];
let items = [];
let slots = [];
let draggedItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let startTime = 0;
let elapsedTime = 0;
let isSubmitted = false;
let score = 0;

// Particle arrays for animations
let zzzParticles = [];
let sparkles = [];
let rainTears = [];
let steamParticles = [];

function setup() {
  const canvas = createCanvas(1000, 700);
  canvas.parent('canvas-container');
  textFont('Noto Sans TC');
  
  // Initialize particles
  for (let i = 0; i < 5; i++) {
    zzzParticles.push({
      x: random(-10, 10),
      y: random(-10, 10),
      size: random(12, 22),
      alpha: random(100, 255),
      speed: random(0.5, 1.2)
    });
  }
  for (let i = 0; i < 8; i++) {
    sparkles.push({
      angle: random(TWO_PI),
      dist: random(30, 50),
      size: random(3, 7),
      speed: random(0.02, 0.05)
    });
  }

  resetGame();
}

function resetGame() {
  isSubmitted = false;
  score = 0;
  startTime = millis();
  elapsedTime = 0;
  draggedItem = null;

  // Questions are fixed per slot order (#1 to #6)
  questions = [...moodData];

  // Configure target slots in a 3x2 grid
  slots = [];
  const cardW = 270;
  const cardH = 160;
  const slotH = 44;
  const startX = 55;
  const startY = 85;
  const gapX = 40;
  const gapY = 30;

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + slotH + gapY);

    slots.push({
      id: i + 1,
      x: x,
      y: y,
      w: cardW,
      h: cardH,
      slotX: x,
      slotY: y + cardH + 10,
      slotW: cardW,
      slotH: slotH,
      correctItem: questions[i],
      assignedItem: null
    });
  }

  // Create bottom tags (shuffled order)
  const shuffled = [...moodData].sort(() => Math.random() - 0.5);
  items = [];
  const tagW = 125;
  const tagH = 40;
  const poolStartX = 45;
  const poolY = 555;
  const poolGap = 28;

  for (let i = 0; i < 6; i++) {
    const tagX = poolStartX + i * (tagW + poolGap);
    items.push({
      data: shuffled[i],
      x: tagX,
      y: poolY,
      w: tagW,
      h: tagH,
      homeX: tagX,
      homeY: poolY,
      currentSlot: null
    });
  }
}

function draw() {
  background(242, 245, 249);

  // 1. Top Bar Header
  drawHeader();

  // 2. Animated Mood Cards & Drop Slots
  for (let slot of slots) {
    drawMoodCard(slot);
    drawSlotBox(slot);
  }

  // 3. Bottom Control Bar & Instructions
  drawBottomPanel();

  // 4. Render tags not currently dragged
  for (let item of items) {
    if (item !== draggedItem) {
      drawTag(item, false);
    }
  }

  // 5. Render active dragged tag on top layer
  if (draggedItem) {
    draggedItem.x = mouseX - dragOffsetX;
    draggedItem.y = mouseY - dragOffsetY;
    drawTag(draggedItem, true);
  }

  // 6. Submit Score Modal Window
  if (isSubmitted) {
    drawScoreModal();
  }
}

// --- Header Section ---
function drawHeader() {
  fill(255);
  noStroke();
  rect(0, 0, width, 65);

  // Quiz Title
  fill(30, 41, 59);
  textSize(20);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("心情動畫連連看", 35, 32);

  // Subtitle / Prompt
  textSize(13);
  textStyle(NORMAL);
  fill(100, 116, 139);
  text("看看每張動畫是什麼心情，把下方的名稱拖曳到圖片下方的格子裡", 200, 32);

  // Counter & Timer status badges
  const pairedCount = slots.filter(s => s.assignedItem !== null).length;

  // Paired Badge
  drawStatusBadge(width - 210, 15, "已配對", `${pairedCount}/6`);

  // Timer Badge
  if (!isSubmitted) {
    elapsedTime = Math.floor((millis() - startTime) / 1000);
  }
  const mins = nf(Math.floor(elapsedTime / 60), 2);
  const secs = nf(elapsedTime % 60, 2);
  drawStatusBadge(width - 110, 15, "時間", `${mins}:${secs}`);
}

function drawStatusBadge(x, y, label, val) {
  fill(255);
  stroke(226, 232, 240);
  strokeWeight(1);
  rect(x, y, 85, 36, 8);

  noStroke();
  fill(148, 163, 184);
  textSize(11);
  textAlign(CENTER, TOP);
  text(label, x + 42.5, y + 4);

  fill(30, 41, 59);
  textSize(14);
  textStyle(BOLD);
  text(val, x + 42.5, y + 17);
  textStyle(NORMAL);
}

// --- Card & Animated Mood Graphics ---
function drawMoodCard(slot) {
  // Card Container Background
  fill(255);
  stroke(226, 232, 240);
  strokeWeight(1.5);
  rect(slot.x, slot.y, slot.w, slot.h, 12);

  // Card Number (#1 - #6) Tag
  fill(51, 65, 85);
  noStroke();
  rect(slot.x, slot.y, 36, 24, 12, 0, 8, 0);
  fill(255);
  textSize(12);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(`#${slot.id}`, slot.x + 18, slot.y + 12);
  textStyle(NORMAL);

  // Render Mood Procedural Animation inside canvas clip region
  push();
  translate(slot.x + slot.w / 2, slot.y + slot.h / 2 + 5);
  renderMoodAnimation(slot.correctItem.type);
  pop();
}

function renderMoodAnimation(type) {
  const t = millis() * 0.003;

  switch (type) {
    case "happy": // 高興: Bouncing Yellow Face + Sparkles
      const bounceY = sin(t * 4) * 8;
      
      // Sparkles around
      noStroke();
      fill(255, 215, 0, 200);
      for (let s of sparkles) {
        let ang = s.angle + t;
        let sx = cos(ang) * (s.dist + sin(t*2)*5);
        let sy = sin(ang) * (s.dist + sin(t*2)*5) + bounceY;
        ellipse(sx, sy, s.size, s.size);
      }

      // Face base
      fill(255, 202, 40);
      ellipse(0, bounceY, 70, 70);

      // Eye Blinks
      fill(60, 40, 20);
      ellipse(-15, bounceY - 8, 8, 12);
      ellipse(15, bounceY - 8, 8, 12);
      fill(255);
      ellipse(-17, bounceY - 10, 3, 3);
      ellipse(13, bounceY - 10, 3, 3);

      // Big Smile
      noFill();
      stroke(60, 40, 20);
      strokeWeight(3.5);
      strokeCap(ROUND);
      arc(0, bounceY + 2, 34, 28, 0.1, PI - 0.1);

      // Rosy cheeks
      noStroke();
      fill(255, 112, 67, 120);
      ellipse(-22, bounceY + 8, 12, 8);
      ellipse(22, bounceY + 8, 12, 8);
      break;

    case "sad": // 悲傷: Dripping Tears + Soft Drooping Face
      const sway = sin(t * 1.5) * 2;
      
      // Face base
      fill(144, 202, 249);
      noStroke();
      ellipse(sway, 5, 70, 68);

      // Drooping sad eyes
      stroke(30, 50, 90);
      strokeWeight(3.5);
      noFill();
      strokeCap(ROUND);
      arc(-15, -2, 16, 12, PI + 0.3, TWO_PI - 0.3);
      arc(15, -2, 16, 12, PI + 0.3, TWO_PI - 0.3);

      // Sad mouth
      arc(0, 24, 22, 16, PI + 0.4, TWO_PI - 0.4);

      // Falling tear animation
      noStroke();
      fill(66, 165, 245);
      let tearY1 = ((millis() * 0.08) % 35) + 5;
      let tearY2 = (((millis() + 400) * 0.08) % 35) + 5;
      ellipse(-16 + sway, tearY1, 6, 9);
      ellipse(16 + sway, tearY2, 6, 9);
      break;

    case "angry": // 憤怒: Shaking Red Face + Steam
      const shakeX = random(-2.5, 2.5);
      const shakeY = random(-2.5, 2.5);

      // Steam puffs rising
      noStroke();
      fill(220, 220, 220, 180);
      let steamY = - (millis() * 0.05) % 25;
      ellipse(-28 + shakeX, -22 + steamY, 10, 10);
      ellipse(28 + shakeX, -22 + steamY, 10, 10);

      // Face base
      fill(239, 83, 80);
      ellipse(shakeX, shakeY + 5, 70, 70);

      // Angry sharp eyebrows
      stroke(50, 10, 10);
      strokeWeight(4);
      line(-24 + shakeX, -10 + shakeY, -8 + shakeX, -2 + shakeY);
      line(24 + shakeX, -10 + shakeY, 8 + shakeX, -2 + shakeY);

      // Intense eyes
      noStroke();
      fill(50, 10, 10);
      ellipse(-15 + shakeX, 4 + shakeY, 7, 7);
      ellipse(15 + shakeX, 4 + shakeY, 7, 7);

      // Grumpy mouth
      stroke(50, 10, 10);
      strokeWeight(3.5);
      noFill();
      arc(0 + shakeX, 26 + shakeY, 26, 18, PI + 0.2, TWO_PI - 0.2);
      break;

    case "shy": // 害羞: Blushing Pink Face Hiding Behind Hands
      const hideY = sin(t * 3) * 3;

      // Face Base
      noStroke();
      fill(248, 187, 208);
      ellipse(0, hideY + 5, 70, 70);

      // Big bright blush
      fill(236, 64, 122, 160);
      ellipse(-20, hideY + 10, 18, 12);
      ellipse(20, hideY + 10, 18, 12);

      // Shy blinking curved eyes
      stroke(100, 30, 60);
      strokeWeight(3);
      noFill();
      arc(-15, hideY, 12, 8, 0, PI);
      arc(15, hideY, 12, 8, 0, PI);

      // Cute small mouth
      ellipse(0, hideY + 18, 6, 6);

      // Hands covering cheeks slightly
      noStroke();
      fill(255, 228, 225);
      ellipse(-22 + sin(t*3)*2, hideY + 16, 18, 18);
      ellipse(22 - sin(t*3)*2, hideY + 16, 18, 18);
      break;

    case "nervous": // 緊張: Sweating Trembling Face
      const trembleX = sin(t * 25) * 1.5;

      // Face base
      noStroke();
      fill(255, 238, 88);
      ellipse(trembleX, 5, 70, 70);

      // Worried Eyebrows
      stroke(80, 70, 20);
      strokeWeight(3);
      noFill();
      arc(-15, -6, 14, 10, PI + 0.5, TWO_PI);
      arc(15, -6, 14, 10, PI, TWO_PI - 0.5);

      // Wide nervous eyes
      fill(255);
      stroke(80, 70, 20);
      strokeWeight(1.5);
      ellipse(-15 + trembleX, 4, 14, 14);
      ellipse(15 + trembleX, 4, 14, 14);
      fill(40);
      ellipse(-13 + trembleX, 4, 5, 5);
      ellipse(13 + trembleX, 4, 5, 5);

      // Wavy nervous mouth
      stroke(80, 70, 20);
      strokeWeight(3);
      noFill();
      beginShape();
      vertex(-12 + trembleX, 22);
      vertex(-4 + trembleX, 18);
      vertex(4 + trembleX, 24);
      vertex(12 + trembleX, 20);
      endShape();

      // Sweat drop sliding down
      noStroke();
      fill(41, 182, 246);
      let sweatY = ((millis() * 0.04) % 20) - 10;
      ellipse(25 + trembleX, sweatY, 7, 10);
      break;

    case "tired": // 疲倦: Yawning Drooping Face + Floating Zzz
      // Floating Zzz Particles
      fill(120, 144, 156);
      textSize(14);
      textStyle(BOLD);
      for (let p of zzzParticles) {
        let pY = (p.y - (millis() * 0.02 * p.speed)) % 40;
        let pX = p.x + sin(pY * 0.1) * 6;
        text("Z", 15 + pX, -15 + pY);
      }

      // Face Base
      noStroke();
      fill(207, 216, 220);
      ellipse(0, 8, 70, 70);

      // Closed Sleepy Eyes (Horizontal Lines)
      stroke(54, 71, 79);
      strokeWeight(3.5);
      line(-22, 2, -8, 2);
      line(8, 2, 22, 2);

      // Yawning Big Open Oval Mouth
      noStroke();
      fill(84, 110, 122);
      ellipse(0, 22, 18, 24);
      break;
  }
}

// --- Target Slot Rendering ---
function drawSlotBox(slot) {
  if (slot.assignedItem) {
    // Slot occupied frame
    stroke(203, 213, 225);
    strokeWeight(1.5);
    fill(248, 250, 252);
    rect(slot.slotX, slot.slotY, slot.slotW, slot.slotH, 8);

    // Keep assigned item centered in slot
    slot.assignedItem.x = slot.slotX + (slot.slotW - slot.assignedItem.w) / 2;
    slot.assignedItem.y = slot.slotY + (slot.slotH - slot.assignedItem.h) / 2;
    drawTag(slot.assignedItem, false, true);
  } else {
    // Empty Slot outline
    stroke(203, 213, 225);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    fill(241, 245, 249);
    rect(slot.slotX, slot.slotY, slot.slotW, slot.slotH, 8);
    drawingContext.setLineDash([]); // reset stroke dash

    noStroke();
    fill(148, 163, 184);
    textSize(13);
    textAlign(CENTER, CENTER);
    text("拖曳名稱到這裡", slot.slotX + slot.slotW / 2, slot.slotY + slot.slotH / 2);
  }
}

// --- Draggable Mood Tag Component ---
function drawTag(item, isDragging, isInSlot = false) {
  push();
  if (isDragging) {
    fill(255);
    stroke(234, 88, 12); // Orange highlight
    strokeWeight(2.5);
    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.15)';
  } else if (isInSlot) {
    fill(255);
    stroke(203, 213, 225);
    strokeWeight(1.5);
  } else {
    fill(255);
    stroke(203, 213, 225);
    strokeWeight(1.5);
  }

  rect(item.x, item.y, item.w, item.h, 20); // Pill shape tag

  // Text content (Chinese + English)
  noStroke();
  fill(30, 41, 59);
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(`${item.data.name} `, item.x + item.w / 2 - 18, item.y + item.h / 2);

  fill(100, 116, 139);
  textSize(11);
  textStyle(NORMAL);
  text(item.data.sub, item.x + item.w / 2 + 18, item.y + item.h / 2 + 1);

  pop();
}

// --- Bottom Controls ---
function drawBottomPanel() {
  fill(255);
  noStroke();
  rect(0, 605, width, 95);

  stroke(226, 232, 240);
  strokeWeight(1);
  line(0, 605, width, 605);

  // Submit Button ("交卷看成績")
  fill(234, 88, 12);
  noStroke();
  rect(35, 630, 130, 44, 8);
  fill(255);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("交卷看成績", 35 + 130 / 2, 630 + 44 / 2);

  // Restart Button ("重新開始")
  fill(255);
  stroke(203, 213, 225);
  strokeWeight(1.5);
  rect(180, 630, 105, 44, 8);
  fill(51, 65, 85);
  noStroke();
  textSize(15);
  textStyle(BOLD);
  text("重新開始", 180 + 105 / 2, 630 + 44 / 2);

  // Instruction Tip
  fill(148, 163, 184);
  textSize(13);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  text("放錯可以拖回這裡", 305, 630 + 44 / 2);
}

// --- User Interaction Events ---
function mousePressed() {
  if (isSubmitted) {
    // Handle "再玩一次" button on submission modal
    const mw = 460;
    const mh = 430;
    const mx = (width - mw) / 2;
    const my = (height - mh) / 2;
    if (mouseX >= mx + mw / 2 - 75 && mouseX <= mx + mw / 2 + 75 &&
        mouseY >= my + mh - 60 && mouseY <= my + mh - 16) {
      resetGame();
    }
    return;
  }

  // Click Submit Button
  if (mouseX >= 35 && mouseX <= 165 && mouseY >= 630 && mouseY <= 674) {
    submitQuiz();
    return;
  }

  // Click Restart Button
  if (mouseX >= 180 && mouseX <= 285 && mouseY >= 630 && mouseY <= 674) {
    resetGame();
    return;
  }

  // Check if user picks up a tag
  for (let item of items) {
    if (mouseX >= item.x && mouseX <= item.x + item.w &&
        mouseY >= item.y && mouseY <= item.y + item.h) {
      draggedItem = item;
      dragOffsetX = mouseX - item.x;
      dragOffsetY = mouseY - item.y;

      // Unassign from current slot if picked from a slot
      if (item.currentSlot) {
        item.currentSlot.assignedItem = null;
        item.currentSlot = null;
      }
      break;
    }
  }
}

function mouseReleased() {
  if (!draggedItem) return;

  let placedInSlot = false;

  // Check if dropped into any target slot
  for (let slot of slots) {
    if (mouseX >= slot.slotX && mouseX <= slot.slotX + slot.slotW &&
        mouseY >= slot.slotY && mouseY <= slot.slotY + slot.slotH) {
      
      placedInSlot = true;

      // Swapping mechanism: If slot is occupied, send occupant back to pool
      if (slot.assignedItem) {
        const occupant = slot.assignedItem;
        occupant.currentSlot = null;
        occupant.x = occupant.homeX;
        occupant.y = occupant.homeY;
      }

      // Assign dragged item to slot
      slot.assignedItem = draggedItem;
      draggedItem.currentSlot = slot;
      break;
    }
  }

  // Reset tag to original pool position if dropped outside any valid slot
  if (!placedInSlot) {
    draggedItem.currentSlot = null;
    draggedItem.x = draggedItem.homeX;
    draggedItem.y = draggedItem.homeY;
  }

  draggedItem = null;
}

// --- Submit & Result Modal ---
function submitQuiz() {
  score = 0;
  for (let slot of slots) {
    if (slot.assignedItem && slot.assignedItem.data.name === slot.correctItem.name) {
      score += 1;
    }
  }
  isSubmitted = true;
}

function drawScoreModal() {
  push();
  // Semi-transparent overlay background
  fill(15, 23, 42, 0.65 * 255);
  noStroke();
  rect(0, 0, width, height);

  // Modal Dialog Box
  const mw = 460;
  const mh = 430;
  const mx = (width - mw) / 2;
  const my = (height - mh) / 2;

  fill(255);
  stroke(226, 232, 240);
  strokeWeight(1);
  rect(mx, my, mw, mh, 16);

  // Title
  fill(30, 41, 59);
  textSize(22);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("測驗結果", mx + mw / 2, my + 38);

  // Summary stats (Score & Time)
  const finalScore = Math.round((score / 6) * 100);
  fill(71, 85, 105);
  textSize(15);
  textStyle(NORMAL);
  text(`得分：${finalScore} 分 (${score} / 6 題正確)`, mx + mw / 2, my + 78);
  text(`完成時間：${Math.floor(elapsedTime / 60)} 分 ${elapsedTime % 60} 秒`, mx + mw / 2, my + 104);

  // Detailed Question Breakdown List (#1 to #6)
  textSize(13);
  textAlign(LEFT, CENTER);
  let startYPos = my + 148;

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const userChoice = s.assignedItem ? s.assignedItem.data.name : "未選擇";
    const isCorrect = (userChoice === s.correctItem.name);

    // List item background
    fill(isCorrect ? 240 : 254, isCorrect ? 253 : 242, isCorrect ? 244 : 242);
    stroke(isCorrect ? 187 : 254, isCorrect ? 247 : 202, isCorrect ? 208 : 202);
    strokeWeight(1);
    rect(mx + 30, startYPos + i * 36 - 12, mw - 60, 30, 6);

    noStroke();
    fill(isCorrect ? 22 : 225, isCorrect ? 101 : 29, isCorrect ? 52 : 72);
    textStyle(BOLD);
    text(`#${s.id} 正確：${s.correctItem.name}`, mx + 42, startYPos + i * 36 + 2);

    fill(71, 85, 105);
    textStyle(NORMAL);
    text(`你的選擇：${userChoice}`, mx + 195, startYPos + i * 36 + 2);

    // Checkmark or Cross mark
    fill(isCorrect ? 22 : 225, isCorrect ? 101 : 29, isCorrect ? 52 : 72);
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text(isCorrect ? "✔ 對" : "✘ 錯", mx + mw - 42, startYPos + i * 36 + 2);
    textAlign(LEFT, CENTER);
  }

  // Play Again Button ("再玩一次")
  fill(234, 88, 12);
  noStroke();
  rect(mx + mw / 2 - 75, my + mh - 58, 150, 42, 8);

  fill(255);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("再玩一次", mx + mw / 2, my + mh - 37);

  pop();
}

