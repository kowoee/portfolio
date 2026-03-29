// =============================================
// FIREBASE — importa os módulos necessários
// Usamos "type=module" no HTML pra isso funcionar
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBl_NeE8NsVY_maEn-D3E3oBPHK61mxMV8",
  authDomain: "portfolio-kaique.firebaseapp.com",
  projectId: "portfolio-kaique",
  storageBucket: "portfolio-kaique.firebasestorage.app",
  messagingSenderId: "773001724023",
  appId: "1:773001724023:web:a22e79c2897e9069c5c672",
  measurementId: "G-5RN21PTG6F"
};

// Inicia o Firebase
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


// =============================================
// CURSOR PERSONALIZADO
// =============================================
const cursor = document.querySelector('.cursor');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

document.querySelectorAll('a, .postit, .skill-card, .gallery-item, .canvas-btn').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(2)');
  el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
});


// =============================================
// EFEITO DE DIGITAÇÃO NO NOME
// =============================================
const nameEl   = document.getElementById('typed-name');
const fullName = 'Kaique Ribeiro Donegar';
let   charIdx  = 0;

function type() {
  if (charIdx < fullName.length) {
    nameEl.textContent += fullName.charAt(charIdx);
    charIdx++;
    setTimeout(type, 80 + Math.random() * 60);
  }
}
setTimeout(type, 400);


// =============================================
// ANIMAÇÃO DAS BARRAS DE SKILL
// =============================================
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.style.getPropertyValue('--fill');
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-fill').forEach(el => skillObserver.observe(el));


// =============================================
// ANIMAÇÃO DE ENTRADA DAS SEÇÕES
// =============================================
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section-card').forEach(el => sectionObserver.observe(el));


// =============================================
// LINK ATIVO NO MENU
// =============================================
const navItems = document.querySelectorAll('.nav-item');

window.addEventListener('scroll', () => {
  let current = '';
  document.querySelectorAll('section').forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) current = section.id;
  });
  navItems.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
});


// =============================================
// GALERIA — LIGHTBOX
// =============================================
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose   = document.getElementById('lightbox-close');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img     = item.querySelector('img');
    const caption = item.dataset.caption || '';
    lightboxImg.src       = img.src;
    lightboxImg.alt       = img.alt;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
  });
});

// Fecha ao clicar no X ou fora da imagem
lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('open');
});


// =============================================
// MURAL COLABORATIVO — CANVAS + FIREBASE
// =============================================
const canvas  = document.getElementById('mural-canvas');
const ctx     = canvas.getContext('2d');
const loading = document.getElementById('canvas-loading');

// Variáveis de estado do desenho
let drawing   = false;
let color     = '#1a1a2e';
let brushSize = 4;
let eraser    = false;

// Cada traço é uma lista de pontos { x, y }
let currentStroke = [];

// ID de sessão único pro visitante (pra poder apagar só os próprios traços)
const sessionId = Math.random().toString(36).slice(2);

// Referência à coleção no Firestore
const strokesRef = collection(db, 'strokes');


// --- Funções de desenho no canvas ---

function getPos(e) {
  // Funciona tanto para mouse quanto para touch
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY
  };
}

function drawStroke(points, strokeColor, size) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = size;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function redrawAll(strokes) {
  // Limpa o canvas e redesenha todos os traços do Firestore
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(s => drawStroke(s.points, s.color, s.size));
}


// --- Eventos de mouse/touch ---

canvas.addEventListener('mousedown',  (e) => { drawing = true; currentStroke = [getPos(e)]; });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; currentStroke = [getPos(e)]; });

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const pos = getPos(e);
  const prev = currentStroke[currentStroke.length - 1];
  currentStroke.push(pos);

  // Desenha só o trecho novo (do ponto anterior até o atual)
  ctx.beginPath();
  ctx.strokeStyle = eraser ? '#ffffff' : color;
  ctx.lineWidth   = eraser ? brushSize * 3 : brushSize;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.moveTo(prev.x, prev.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!drawing) return;
  const pos = getPos(e);
  const prev = currentStroke[currentStroke.length - 1];
  currentStroke.push(pos);

  ctx.beginPath();
  ctx.strokeStyle = eraser ? '#ffffff' : color;
  ctx.lineWidth   = eraser ? brushSize * 3 : brushSize;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.moveTo(prev.x, prev.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener('mouseup',    () => finishStroke());
canvas.addEventListener('mouseleave', () => finishStroke());
canvas.addEventListener('touchend',   () => finishStroke());

async function finishStroke() {
  if (!drawing || currentStroke.length === 0) return;
  drawing = false;

  // Salva o traço no Firestore
  try {
    await addDoc(strokesRef, {
      points:    currentStroke,
      color:     eraser ? '#ffffff' : color,
      size:      eraser ? brushSize * 3 : brushSize,
      sessionId: sessionId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Erro ao salvar traço:', err);
  }

  currentStroke = [];
}


// --- Escuta traços em tempo real do Firestore ---

const q = query(strokesRef, orderBy('createdAt', 'asc'));

// Guarda todos os traços em memória pra poder redesenhar
let allStrokes = [];

onSnapshot(q, (snapshot) => {
  allStrokes = [];
  snapshot.forEach(doc => allStrokes.push(doc.data()));
  redrawAll(allStrokes);

  // Atualiza o contador
  document.getElementById('stroke-count').textContent = allStrokes.length;

  // Esconde o loading quando os dados chegarem
  loading.classList.add('hidden');
});


// --- Controles de cor e tamanho ---

document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    color  = btn.dataset.color;
    eraser = false;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('btn-eraser').classList.remove('active-eraser');
  });
});

document.getElementById('color-free').addEventListener('input', (e) => {
  color  = e.target.value;
  eraser = false;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-eraser').classList.remove('active-eraser');
});

const brushInput   = document.getElementById('brush-size');
const brushPreview = document.getElementById('brush-preview');

brushInput.addEventListener('input', (e) => {
  brushSize = parseInt(e.target.value);
  // Mostra o tamanho visualmente
  brushPreview.style.fontSize = (brushSize * 0.8 + 8) + 'px';
});

document.getElementById('btn-eraser').addEventListener('click', (e) => {
  eraser = !eraser;
  e.target.classList.toggle('active-eraser', eraser);
});

// Apaga apenas os traços desta sessão
document.getElementById('btn-clear').addEventListener('click', async () => {
  // Redesenha sem os traços desta sessão
  const filtered = allStrokes.filter(s => s.sessionId !== sessionId);
  redrawAll(filtered);

  // Nota: apagar do Firestore requer permissão de escrita/delete nas regras.
  // Por simplicidade, o botão apenas esconde os traços localmente até a próxima recarga.
  // Para deletar de verdade, precisaria de Cloud Functions ou regras de segurança específicas.
  alert('Seus traços foram escondidos localmente! 🗑️\nPara deletar permanentemente, precisaria de um backend.');
});
