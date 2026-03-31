// =============================================
// FIREBASE
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, where, Timestamp, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl_NeE8NsVY_maEn-D3E3oBPHK61mxMV8",
  authDomain: "portfolio-kaique.firebaseapp.com",
  projectId: "portfolio-kaique",
  storageBucket: "portfolio-kaique.firebasestorage.app",
  messagingSenderId: "773001724023",
  appId: "1:773001724023:web:a22e79c2897e9069c5c672"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const drawingsRef = collection(db, 'drawings');



const noiseCanvas = document.getElementById('noise-bg');
const noiseCtx    = noiseCanvas.getContext('2d');
let   noiseFrame  = 0;

function resizeNoise() {
  noiseCanvas.width  = window.innerWidth;
  noiseCanvas.height = window.innerHeight;
}
resizeNoise();
window.addEventListener('resize', resizeNoise);

function drawNoise() {
  const w = noiseCanvas.width;
  const h = noiseCanvas.height;

  // Cria um bloco de pixels aleatórios
  const imageData = noiseCtx.createImageData(w, h);
  const data      = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Valor aleatório de cinza
    const val = Math.random() * 255;
    data[i]     = val; // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
    data[i + 3] = 255; // Alpha
  }

  noiseCtx.putImageData(imageData, 0, 0);

  // Roda a ~12fps pra não pesar — aparência de película
  noiseFrame++;
  setTimeout(() => requestAnimationFrame(drawNoise), 1000 / 12);
}

drawNoise();



// =============================================
// CURSOR PERSONALIZADO
// =============================================
const cursor = document.querySelector('.cursor');
document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.querySelectorAll('a, .postit, .skill-card, .gallery-item, .canvas-btn, .drawing-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(2)');
  el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
});

// Tema escuro
const themeBtn = document.getElementById('theme-toggle');
const saved    = localStorage.getItem('theme');

if (saved === 'dark') {
  document.body.classList.add('dark');
  themeBtn.textContent = '🌙';
}

themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeBtn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// =============================================
// DIGITAÇÃO NO NOME
// =============================================
const nameEl   = document.getElementById('typed-name');
const fullName = 'Kaique Donegar';
let   charIdx  = 0;
function type() {
  if (charIdx < fullName.length) {
    nameEl.textContent += fullName.charAt(charIdx++);
    setTimeout(type, 80 + Math.random() * 60);
  }
}
setTimeout(type, 400);


// =============================================
// ANIMAÇÕES DE SCROLL
// =============================================
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.width = e.target.style.getPropertyValue('--fill');
      skillObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-fill').forEach(el => skillObserver.observe(el));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.section-card').forEach(el => sectionObserver.observe(el));

// Link ativo no menu
const navItems = document.querySelectorAll('.nav-item');
window.addEventListener('scroll', () => {
  let current = '';
  document.querySelectorAll('section').forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  navItems.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
});


// =============================================
// LIGHTBOX DA GALERIA DE ARTES
// =============================================
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.querySelector('img').src;
    lightboxCaption.textContent = item.dataset.caption || '';
    lightbox.classList.add('open');
  });
});
document.getElementById('lightbox-close').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });


// =============================================
// CANVAS DE DESENHO
// =============================================
const canvas  = document.getElementById('draw-canvas');
const ctx     = canvas.getContext('2d');

let drawing   = false;
let color     = '#1a1a2e';
let brushSize = 4;
let eraser    = false;
let history   = []; // para desfazer

// Salva estado atual no histórico
function saveHistory() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > 30) history.shift(); // limita a 30 passos
}

function getPos(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
}

canvas.addEventListener('mousedown', e => {
  saveHistory();
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  saveHistory();
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

function drawMove(e) {
  if (!drawing) return;
  const pos = getPos(e);
  ctx.strokeStyle = eraser ? '#ffffff' : color;
  ctx.lineWidth   = eraser ? brushSize * 3 : brushSize;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

canvas.addEventListener('mousemove', drawMove);
canvas.addEventListener('touchmove', e => { e.preventDefault(); drawMove(e); });
canvas.addEventListener('mouseup',    () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mouseleave', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('touchend',   () => { drawing = false; ctx.beginPath(); });


// Controles de cor
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    color  = btn.dataset.color;
    eraser = false;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('btn-eraser').classList.remove('active-eraser');
  });
});
document.getElementById('color-free').addEventListener('input', e => {
  color  = e.target.value;
  eraser = false;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-eraser').classList.remove('active-eraser');
});

// Tamanho do pincel
const brushInput   = document.getElementById('brush-size');
const brushPreview = document.getElementById('brush-preview');
brushInput.addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
  brushPreview.style.fontSize = (brushSize * 0.8 + 8) + 'px';
});

// Borracha
document.getElementById('btn-eraser').addEventListener('click', e => {
  eraser = !eraser;
  e.target.classList.toggle('active-eraser', eraser);
});

// Desfazer
document.getElementById('btn-undo').addEventListener('click', () => {
  if (history.length === 0) return;
  ctx.putImageData(history.pop(), 0, 0);
});

// Limpar tudo
document.getElementById('btn-reset').addEventListener('click', () => {
  saveHistory();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});


// =============================================
// PUBLICAR DESENHO
// =============================================
const SESSION_KEY = 'mural_published_id';
const EXPIRY_KEY  = 'mural_published_expiry';

// Verifica se já publicou e se ainda não expirou
function alreadyPublished() {
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return false;
  return Date.now() < parseInt(expiry);
}

function getPublishedId() {
  return localStorage.getItem(SESSION_KEY);
}

function setPublished(id) {
  const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem(SESSION_KEY,  id);
  localStorage.setItem(EXPIRY_KEY, thirtyDays.toString());
}

function clearPublished() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

// Mostra ou esconde o botão de publicar
function updatePublishUI() {
  const publishArea     = document.getElementById('publish-area');
  const alreadyEl       = document.getElementById('already-published');
  if (alreadyPublished()) {
    publishArea.style.display  = 'none';
    alreadyEl.style.display    = 'flex';
  } else {
    publishArea.style.display  = 'flex';
    alreadyEl.style.display    = 'none';
  }
}
updatePublishUI();

// Publicar
document.getElementById('btn-publish').addEventListener('click', async () => {
  if (alreadyPublished()) return;

  // Converte o canvas pra imagem base64
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width  = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.fillStyle = '#ffffff';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  tempCtx.drawImage(canvas, 0, 0);

  const imageData = tempCanvas.toDataURL('image/png');

  // Verifica se o canvas não está vazio
  const blank = document.createElement('canvas');
  blank.width = canvas.width; blank.height = canvas.height;
  if (imageData === blank.toDataURL('image/png')) {
    alert('Desenha algo primeiro! 🎨');
    return;
  }

  const caption = document.getElementById('publish-caption').value.trim();
  const name    = document.getElementById('publish-name').value.trim();

  const btn = document.getElementById('btn-publish');
  btn.textContent = 'publicando...';
  btn.disabled = true;

  try {
    // 30 dias a partir de agora
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const docRef = await addDoc(drawingsRef, {
      imageData,
      caption:   caption || '',
      author:    name    || 'anônimo',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt)
    });

    setPublished(docRef.id);
    updatePublishUI();
    alert('Desenho publicado! 🎉');
  } catch (err) {
    console.error(err);
    alert('Erro ao publicar. Tenta de novo!');
    btn.textContent = '📌 publicar no mural';
    btn.disabled = false;
  }
});

// Apagar publicação anterior e publicar de novo
document.getElementById('btn-reset-published').addEventListener('click', async () => {
  const id = getPublishedId();
  if (id) {
    try { await deleteDoc(doc(db, 'drawings', id)); } catch (e) { /* pode ter expirado */ }
  }
  clearPublished();
  updatePublishUI();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history = [];
});


// =============================================
// GALERIA PÚBLICA — lê do Firebase em tempo real
// =============================================
const muralLightbox        = document.getElementById('mural-lightbox');
const muralLightboxImg     = document.getElementById('mural-lightbox-img');
const muralLightboxCaption = document.getElementById('mural-lightbox-caption');
const muralLightboxAuthor  = document.getElementById('mural-lightbox-author');
const muralLightboxDate    = document.getElementById('mural-lightbox-date');

document.getElementById('mural-lightbox-close').addEventListener('click', () => muralLightbox.classList.remove('open'));
muralLightbox.addEventListener('click', e => { if (e.target === muralLightbox) muralLightbox.classList.remove('open'); });

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = timestamp.toDate();
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Rotações aleatórias mas consistentes pra cada card
function cardRot(id) {
  let hash = 0;
  for (let c of id) hash += c.charCodeAt(0);
  return ((hash % 5) - 2) + 'deg'; // entre -2deg e +2deg
}

// Escuta a coleção em tempo real, filtra desenhos não expirados
const now = Timestamp.now();
const q   = query(drawingsRef, orderBy('createdAt', 'desc'));

onSnapshot(q, (snapshot) => {
  const gallery  = document.getElementById('public-gallery');
  const emptyEl  = document.getElementById('gallery-empty');
  const countEl  = document.getElementById('drawing-count');

  // Filtra expirados no cliente (Firestore free tier não suporta delete automático)
  const valid = snapshot.docs.filter(d => {
    const data = d.data();
    return data.expiresAt && data.expiresAt.toMillis() > Date.now();
  });

  countEl.textContent = valid.length;

  if (valid.length === 0) {
    gallery.innerHTML = '';
    gallery.appendChild(emptyEl);
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  gallery.innerHTML = '';

  valid.forEach(docSnap => {
    const data = docSnap.data();
    const rot  = cardRot(docSnap.id);

    const card = document.createElement('div');
    card.className = 'drawing-card';
    card.style.setProperty('--rot', rot);

    const img = document.createElement('img');
    img.src = data.imageData;
    img.alt = data.caption || 'desenho';

    const info = document.createElement('div');
    info.className = 'drawing-card-info';
    info.innerHTML = `
      <span class="drawing-card-caption">${data.caption || '(sem legenda)'}</span>
      <span class="drawing-card-author">✏️ ${data.author || 'anônimo'}</span>
      <span class="drawing-card-date">${formatDate(data.createdAt)}</span>
    `;

    card.appendChild(img);
    card.appendChild(info);

    // Abre lightbox ao clicar
    card.addEventListener('click', () => {
      muralLightboxImg.src            = data.imageData;
      muralLightboxCaption.textContent = data.caption || '(sem legenda)';
      muralLightboxAuthor.textContent  = '✏️ ' + (data.author || 'anônimo');
      muralLightboxDate.textContent    = formatDate(data.createdAt);
      muralLightbox.classList.add('open');
    });

    gallery.appendChild(card);
  });
});
