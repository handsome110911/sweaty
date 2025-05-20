let items = [
  { name: "未中獎", probability: 100 }
];
function renderItems() {
  const list = document.getElementById('item-list');
  list.innerHTML = '';
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'item-entry';
    const nameInput = document.createElement('input');
    nameInput.value = item.name;
    nameInput.oninput = e => {
      items[index].name = e.target.value;
      drawWheel();
    };
    const probInput = document.createElement('input');
    probInput.type = 'number';
    probInput.value = item.probability;
    probInput.min = 0;
    probInput.oninput = e => {
      const newProb = parseFloat(e.target.value);
      if (isNaN(newProb)) return;
      items[index].probability = newProb;
      autoAdjustNone();
      drawWheel();
    };
    const delBtn = document.createElement('button');
    delBtn.textContent = '刪除';
    delBtn.onclick = () => {
      if (items.length <= 1) return alert("必須保留至少一個項目！");
      items.splice(index, 1);
      autoAdjustNone();
      drawWheel();
      renderItems();
    };
    div.append(nameInput, probInput, delBtn);
    list.appendChild(div);
  });
}
function getTotalProbability() {
  return items.reduce((acc, item) => acc + item.probability, 0);
}
function autoAdjustNone() {
  const total = getTotalProbability();
  let noneItem = items.find(i => i.name === '未中獎');
  if (!noneItem) {
    noneItem = { name: '未中獎', probability: 0 };
    items.push(noneItem);
  }
  if (total > 100) {
    alert("總機率超過 100%，請重新分配！");
  } else {
    noneItem.probability = 100 - (total - noneItem.probability);
  }
  renderItems();
}
function addItem() {
  if (getTotalProbability() >= 100) return alert("無法新增：總機率已達 100%");
  items.push({ name: `項目${items.length}`, probability: 0 });
  autoAdjustNone();
  renderItems();
  drawWheel();
}
function resetItems() {
  if (confirm("確定要重設所有項目？")) {
    items = [{ name: "未中獎", probability: 100 }];
    renderItems();
    drawWheel();
  }
}
function removeLastItem() {
  if (items.length <= 1) return alert("必須保留至少一個項目！");
  items.pop();
  autoAdjustNone();
  renderItems();
  drawWheel();
}

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let spinning = false;

function drawWheel() {
  const total = getTotalProbability();
  const radius = canvas.width / 2;
  let startAngle = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  items.forEach(item => {
    const sliceAngle = (item.probability / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = randomColor(item.name);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillText(item.name, radius - 10, 0);
    ctx.restore();
    startAngle += sliceAngle;
  });
  drawPointer();
}
function drawPointer() {
  const r = canvas.width / 2;
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(r - 10, 20);
  ctx.lineTo(r + 10, 20);
  ctx.closePath();
  ctx.fill();
}
function randomColor(seed) {
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
function spin(times) {
  if (spinning || getTotalProbability() !== 100) {
    alert("請確保機率總和為100，並避免重複點擊。");
    return;
  }
  const resultCount = {};
  for (let i = 0; i < times; i++) {
    const result = drawResult();
    resultCount[result] = (resultCount[result] || 0) + 1;
  }
  animateSpin(resultCount);
}
function spinCustom() {
  const times = parseInt(document.getElementById('custom-times').value);
  if (isNaN(times) || times <= 0 || times > 9999) {
    return alert("請輸入 1 到 9999 的轉盤次數！");
  }
  spin(times);
}
function drawResult() {
  const rand = Math.random() * 100;
  let acc = 0;
  for (let item of items) {
    acc += item.probability;
    if (rand <= acc) return item.name;
  }
  return "未中獎";
}
function animateSpin(results) {
  spinning = true;
  const resultNames = Object.keys(results);
  const chosen = resultNames[Math.floor(Math.random() * resultNames.length)];
  const index = items.findIndex(i => i.name === chosen);
  let totalAngle = 0;
  for (let i = 0; i <= index; i++) {
    totalAngle += (items[i].probability / 100) * 360;
  }
  const rotation = 360 * 5 + (360 - totalAngle + (items[index].probability / 100 * 360) / 2);
  const duration = 2000;
  const start = performance.now();
  function animate(t) {
    const now = t - start;
    const progress = Math.min(now / duration, 1);
    const eased = easeOutCubic(progress);
    const angle = eased * rotation;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheel();
    ctx.restore();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      showResult(results);
    }
  }
  requestAnimationFrame(animate);
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function showResult(results) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = "<h3>🎉 結果統計：</h3>" + Object.entries(results)
    .map(([name, count]) => `${name}: ${count} 次`)
    .join('<br>');
}
renderItems();
drawWheel();