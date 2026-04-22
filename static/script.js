// =============================================
// AI Accident Detection — Professional UI Script
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initUploadZone();
});

// ===== Subtle Particle Network =====
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = Math.random() * 1.5 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.25 + 0.05;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160, 160, 170, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function connectNearby() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(160, 160, 170, ${0.04 * (1 - dist / 140)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectNearby();
    requestAnimationFrame(loop);
  }

  loop();
}

// ===== Upload Zone Logic =====
function initUploadZone() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('video-input');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const fileThumb = document.getElementById('file-thumb');
  const removeBtn = document.getElementById('file-remove');
  const submitBtn = document.getElementById('submit-btn');
  const form = document.getElementById('upload-form');
  const processing = document.getElementById('processing-section');
  const progressFill = document.getElementById('progress-fill');

  if (!zone) return;

  // Click zone to pick file
  zone.addEventListener('click', () => fileInput.click());

  // Drag & drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length && files[0].type.startsWith('video/')) {
      fileInput.files = files;
      showFile(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) showFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearFile();
  });

  function showFile(file) {
    fileName.textContent = file.name;
    fileSize.textContent = fmtSize(file.size);
    fileInfo.classList.add('visible');
    submitBtn.classList.add('visible');

    // Generate thumbnail from video
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.muted = true;
    vid.src = URL.createObjectURL(file);
    vid.addEventListener('loadeddata', () => { vid.currentTime = 0.5; });
    vid.addEventListener('seeked', () => {
      const c = document.createElement('canvas');
      c.width = 96; c.height = 96;
      c.getContext('2d').drawImage(vid, 0, 0, 96, 96);
      fileThumb.src = c.toDataURL();
      URL.revokeObjectURL(vid.src);
    });

    setStep(1);
  }

  function clearFile() {
    fileInput.value = '';
    fileInfo.classList.remove('visible');
    submitBtn.classList.remove('visible');
    fileThumb.src = '';
    setStep(0);
  }

  // AJAX submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!fileInput.files.length) return;

    // Switch to processing UI
    zone.style.display = 'none';
    fileInfo.style.display = 'none';
    submitBtn.style.display = 'none';
    processing.classList.add('visible');
    setStep(1, true);

    // Fake progress
    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 6;
      if (pct > 92) pct = 92;
      progressFill.style.width = pct + '%';
    }, 350);

    const fd = new FormData();
    fd.append('video', fileInput.files[0]);

    fetch('/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(data => {
        clearInterval(iv);
        progressFill.style.width = '100%';
        setStep(2);

        setTimeout(() => {
          const p = new URLSearchParams({
            accident: data.accident,
            image_path: data.image_path || '',
            frames: data.stats.frames_analyzed,
            time: data.stats.processing_time
          });
          window.location.href = '/result?' + p.toString();
        }, 500);
      })
      .catch(() => {
        clearInterval(iv);
        form.submit(); // fallback
      });
  });
}

// ===== Step Indicator =====
function setStep(idx, isProcessing = false) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i < idx) el.classList.add('completed');
    else if (i === idx) el.classList.add('active');
  });

  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('filled', i < idx);
  });

  if (isProcessing) {
    const s1 = document.querySelectorAll('.step')[1];
    if (s1) { s1.classList.remove('completed'); s1.classList.add('active'); }
  }
}

// ===== Util =====
function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
