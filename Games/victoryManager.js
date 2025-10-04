/**
 * Victory Manager - Shared victory celebration system for all Wingit! games
 * Provides 12 different visual effects and 10 victory music tracks
 * Randomly combines 2 visual effects + 1 music track per victory
 */

(function(window) {
  'use strict';

  // State management
  let activeEffects = [];
  let currentMusicTrack = null;
  let lastCombination = null;
  let isMuted = false;
  
  // Music tracks (relative to Games directory)
  const MUSIC_TRACKS = [
    '../assets/audio/moveonup.mp3',
    '../assets/audio/Celebrationchiptune.mp3',
    '../assets/audio/wearethechampions.mp3',
    '../assets/audio/astley.mp3',
    '../assets/audio/gthang.mp3',
    '../assets/audio/cindi.mp3',
    '../assets/audio/bgs.mp3',
    '../assets/audio/elvis.mp3',
    '../assets/audio/holiday.mp3',
    '../assets/audio/axelf.mp3'
  ];

  // Visual effect registry
  const VISUAL_EFFECTS = {
    confetti: {
      name: 'confetti',
      start: startConfetti,
      stop: stopConfetti
    },
    slowStrobe: {
      name: 'slowStrobe',
      start: startSlowStrobe,
      stop: stopSlowStrobe
    },
    sparkles: {
      name: 'sparkles',
      start: startSparkles,
      stop: stopSparkles
    },
    fireworks: {
      name: 'fireworks',
      start: startFireworks,
      stop: stopFireworks
    },
    coloredSpotlightSweep: {
      name: 'coloredSpotlightSweep',
      start: startColoredSpotlightSweep,
      stop: stopColoredSpotlightSweep
    },
    pulsingBackgroundGlow: {
      name: 'pulsingBackgroundGlow',
      start: startPulsingBackgroundGlow,
      stop: stopPulsingBackgroundGlow
    },
    floatingStars: {
      name: 'floatingStars',
      start: startFloatingStars,
      stop: stopFloatingStars
    },
    screenRipple: {
      name: 'screenRipple',
      start: startScreenRipple,
      stop: stopScreenRipple
    },
    particleSwirl: {
      name: 'particleSwirl',
      start: startParticleSwirl,
      stop: stopParticleSwirl
    },
    goldOverlay: {
      name: 'goldOverlay',
      start: startGoldOverlay,
      stop: stopGoldOverlay
    },
    cameraShake: {
      name: 'cameraShake',
      start: startCameraShake,
      stop: stopCameraShake
    },
    lightBurst: {
      name: 'lightBurst',
      start: startLightBurst,
      stop: stopLightBurst
    }
  };

  // ==================== MAIN API ====================

  /**
   * Play victory sequence with 2 random visual effects + 1 random music track
   * @param {Object} options - Configuration options
   * @param {boolean} options.muted - Whether audio should be muted
   * @param {Function} options.getMuteState - Function to get current mute state
   */
  function playVictorySequence(options = {}) {
    try {
      // Get mute state
      isMuted = options.muted || (options.getMuteState && options.getMuteState()) || false;

      // Select 2 unique visual effects and 1 music track
      const combination = selectRandomCombination();
      
      // Start visual effects
      combination.effects.forEach(effectName => {
        const effect = VISUAL_EFFECTS[effectName];
        if (effect && effect.start) {
          try {
            effect.start();
            activeEffects.push(effect);
          } catch (err) {
            console.warn(`Failed to start effect: ${effectName}`, err);
          }
        }
      });

      // Play music
      playVictoryMusic(combination.music);

      // Store combination to avoid repeating
      lastCombination = combination;

    } catch (err) {
      console.error('Error in playVictorySequence:', err);
    }
  }

  /**
   * Stop all active victory effects and music
   */
  function stopVictorySequence() {
    try {
      // Stop all active visual effects
      activeEffects.forEach(effect => {
        if (effect && effect.stop) {
          try {
            effect.stop();
          } catch (err) {
            console.warn(`Failed to stop effect: ${effect.name}`, err);
          }
        }
      });
      activeEffects = [];

      // Stop music
      if (currentMusicTrack) {
        try {
          currentMusicTrack.pause();
          currentMusicTrack.currentTime = 0;
          currentMusicTrack = null;
        } catch (err) {
          console.warn('Failed to stop music:', err);
        }
      }

    } catch (err) {
      console.error('Error in stopVictorySequence:', err);
    }
  }

  /**
   * Update mute state for currently playing music
   * @param {boolean} muted - New mute state
   */
  function updateMuteState(muted) {
    isMuted = muted;
    if (currentMusicTrack) {
      currentMusicTrack.muted = muted;
    }
  }

  // ==================== SELECTION LOGIC ====================

  function selectRandomCombination() {
    const effectNames = Object.keys(VISUAL_EFFECTS);
    let selectedEffects = [];
    let selectedMusic = '';

    // Select 2 unique visual effects
    const shuffled = [...effectNames].sort(() => Math.random() - 0.5);
    selectedEffects = shuffled.slice(0, 2);

    // Select 1 music track
    selectedMusic = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];

    // Try to avoid repeating the exact same combination
    if (lastCombination) {
      const sameEffects = selectedEffects.every(e => lastCombination.effects.includes(e));
      const sameMusic = selectedMusic === lastCombination.music;
      
      if (sameEffects && sameMusic && Math.random() > 0.3) {
        // 70% chance to reroll if same combination
        return selectRandomCombination();
      }
    }

    return {
      effects: selectedEffects,
      music: selectedMusic
    };
  }

  function playVictoryMusic(musicPath) {
    try {
      currentMusicTrack = new Audio(musicPath);
      currentMusicTrack.volume = 0.3;
      currentMusicTrack.muted = isMuted;
      
      currentMusicTrack.play().catch(err => {
        console.warn('Failed to play victory music:', err);
      });
    } catch (err) {
      console.error('Error creating audio:', err);
    }
  }

  // ==================== VISUAL EFFECTS ====================

  // Effect 1: Confetti
  let confettiCanvas, confettiCtx, confettiParticles = [], confettiAnimationId = null;
  
  function startConfetti() {
    confettiCanvas = getOrCreateCanvas('victoryConfettiCanvas');
    confettiCtx = confettiCanvas.getContext('2d');
    confettiParticles = [];

    const colors = ['#ffd54a', '#5cd0ff', '#ff6b6b', '#a5d6a7', '#ffffff', '#ff9800', '#9c27b0'];
    const particleCount = Math.floor((confettiCanvas.width * confettiCanvas.height) / 9000);

    for (let i = 0; i < particleCount; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        radius: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 6,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    function animate() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiParticles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > confettiCanvas.height + 20) p.y = -20;
        if (p.x < -20) p.x = confettiCanvas.width + 20;
        if (p.x > confettiCanvas.width + 20) p.x = -20;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rotation);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        confettiCtx.restore();
      });
      confettiAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopConfetti() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    if (confettiCanvas) {
      confettiCanvas.remove();
      confettiCanvas = null;
    }
    confettiParticles = [];
  }

  // Effect 2: Slow Strobe
  let strobeOverlay, strobeIntervalId = null;

  function startSlowStrobe() {
    strobeOverlay = getOrCreateOverlay('victoryStrobeOverlay');
    strobeOverlay.style.background = 'rgba(255, 255, 255, 0.3)';
    strobeOverlay.style.opacity = '0';
    strobeOverlay.style.transition = 'opacity 0.3s ease';

    strobeIntervalId = setInterval(() => {
      strobeOverlay.style.opacity = strobeOverlay.style.opacity === '0' ? '1' : '0';
    }, 600);
  }

  function stopSlowStrobe() {
    if (strobeIntervalId) {
      clearInterval(strobeIntervalId);
      strobeIntervalId = null;
    }
    if (strobeOverlay) {
      strobeOverlay.remove();
      strobeOverlay = null;
    }
  }

  // Effect 3: Sparkles
  let sparklesCanvas, sparklesCtx, sparklesParticles = [], sparklesAnimationId = null;

  function startSparkles() {
    sparklesCanvas = getOrCreateCanvas('victorySparklesCanvas');
    sparklesCtx = sparklesCanvas.getContext('2d');
    sparklesParticles = [];

    for (let i = 0; i < 50; i++) {
      sparklesParticles.push({
        x: Math.random() * sparklesCanvas.width,
        y: Math.random() * sparklesCanvas.height,
        size: Math.random() * 3 + 1,
        alpha: Math.random(),
        fadeSpeed: Math.random() * 0.02 + 0.01,
        growing: Math.random() > 0.5
      });
    }

    function animate() {
      sparklesCtx.clearRect(0, 0, sparklesCanvas.width, sparklesCanvas.height);
      sparklesParticles.forEach(p => {
        if (p.growing) {
          p.alpha += p.fadeSpeed;
          if (p.alpha >= 1) {
            p.alpha = 1;
            p.growing = false;
          }
        } else {
          p.alpha -= p.fadeSpeed;
          if (p.alpha <= 0) {
            p.alpha = 0;
            p.growing = true;
            p.x = Math.random() * sparklesCanvas.width;
            p.y = Math.random() * sparklesCanvas.height;
          }
        }

        sparklesCtx.save();
        sparklesCtx.globalAlpha = p.alpha;
        sparklesCtx.fillStyle = '#ffffff';
        sparklesCtx.shadowBlur = 10;
        sparklesCtx.shadowColor = '#ffff00';
        sparklesCtx.beginPath();
        sparklesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        sparklesCtx.fill();
        sparklesCtx.restore();
      });
      sparklesAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopSparkles() {
    if (sparklesAnimationId) {
      cancelAnimationFrame(sparklesAnimationId);
      sparklesAnimationId = null;
    }
    if (sparklesCanvas) {
      sparklesCanvas.remove();
      sparklesCanvas = null;
    }
    sparklesParticles = [];
  }

  // Effect 4: Fireworks
  let fireworksCanvas, fireworksCtx, fireworksParticles = [], fireworksAnimationId = null;

  function startFireworks() {
    fireworksCanvas = getOrCreateCanvas('victoryFireworksCanvas');
    fireworksCtx = fireworksCanvas.getContext('2d');
    fireworksParticles = [];

    function createFirework() {
      const x = Math.random() * fireworksCanvas.width;
      const y = Math.random() * fireworksCanvas.height * 0.5;
      const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = Math.random() * 3 + 2;
        fireworksParticles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 1,
          decay: Math.random() * 0.015 + 0.01
        });
      }
    }

    const fireworkInterval = setInterval(createFirework, 800);

    function animate() {
      fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      fireworksCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

      fireworksParticles = fireworksParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= p.decay;

        if (p.life > 0) {
          fireworksCtx.save();
          fireworksCtx.globalAlpha = p.life;
          fireworksCtx.fillStyle = p.color;
          fireworksCtx.beginPath();
          fireworksCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          fireworksCtx.fill();
          fireworksCtx.restore();
          return true;
        }
        return false;
      });

      fireworksAnimationId = requestAnimationFrame(animate);
    }
    animate();

    // Store interval for cleanup
    fireworksCanvas._interval = fireworkInterval;
  }

  function stopFireworks() {
    if (fireworksAnimationId) {
      cancelAnimationFrame(fireworksAnimationId);
      fireworksAnimationId = null;
    }
    if (fireworksCanvas) {
      if (fireworksCanvas._interval) {
        clearInterval(fireworksCanvas._interval);
      }
      fireworksCanvas.remove();
      fireworksCanvas = null;
    }
    fireworksParticles = [];
  }

  // Effect 5: Colored Spotlight Sweep
  let spotlightOverlay, spotlightAnimationId = null;

  function startColoredSpotlightSweep() {
    spotlightOverlay = getOrCreateOverlay('victorySpotlightOverlay');
    let angle = 0;

    function animate() {
      angle += 0.02;
      const hue = (angle * 50) % 360;
      const x = 50 + Math.sin(angle) * 30;
      const y = 50 + Math.cos(angle) * 30;
      
      spotlightOverlay.style.background = `radial-gradient(circle at ${x}% ${y}%, 
        hsla(${hue}, 100%, 50%, 0.3) 0%, 
        transparent 40%)`;
      
      spotlightAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopColoredSpotlightSweep() {
    if (spotlightAnimationId) {
      cancelAnimationFrame(spotlightAnimationId);
      spotlightAnimationId = null;
    }
    if (spotlightOverlay) {
      spotlightOverlay.remove();
      spotlightOverlay = null;
    }
  }

  // Effect 6: Pulsing Background Glow
  let pulsingOverlay, pulsingAnimationId = null;

  function startPulsingBackgroundGlow() {
    pulsingOverlay = getOrCreateOverlay('victoryPulsingOverlay');
    let pulse = 0;

    function animate() {
      pulse += 0.05;
      const opacity = (Math.sin(pulse) + 1) / 2 * 0.3;
      const hue = (pulse * 20) % 360;
      pulsingOverlay.style.background = `hsla(${hue}, 100%, 50%, ${opacity})`;
      pulsingAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopPulsingBackgroundGlow() {
    if (pulsingAnimationId) {
      cancelAnimationFrame(pulsingAnimationId);
      pulsingAnimationId = null;
    }
    if (pulsingOverlay) {
      pulsingOverlay.remove();
      pulsingOverlay = null;
    }
  }

  // Effect 7: Floating Stars
  let starsCanvas, starsCtx, starsParticles = [], starsAnimationId = null;

  function startFloatingStars() {
    starsCanvas = getOrCreateCanvas('victoryStarsCanvas');
    starsCtx = starsCanvas.getContext('2d');
    starsParticles = [];

    for (let i = 0; i < 30; i++) {
      starsParticles.push({
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        size: Math.random() * 20 + 10,
        speedY: Math.random() * 0.5 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    function drawStar(ctx, x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffff00';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const x1 = Math.cos(angle) * size;
        const y1 = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        
        const angle2 = angle + Math.PI / 5;
        const x2 = Math.cos(angle2) * size * 0.5;
        const y2 = Math.sin(angle2) * size * 0.5;
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      starsParticles.forEach(p => {
        p.y -= p.speedY;
        p.rotation += p.rotationSpeed;
        
        if (p.y < -p.size) {
          p.y = starsCanvas.height + p.size;
          p.x = Math.random() * starsCanvas.width;
        }

        drawStar(starsCtx, p.x, p.y, p.size, p.rotation);
      });
      starsAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopFloatingStars() {
    if (starsAnimationId) {
      cancelAnimationFrame(starsAnimationId);
      starsAnimationId = null;
    }
    if (starsCanvas) {
      starsCanvas.remove();
      starsCanvas = null;
    }
    starsParticles = [];
  }

  // Effect 8: Screen Ripple
  let rippleOverlay, rippleAnimationId = null;

  function startScreenRipple() {
    rippleOverlay = getOrCreateOverlay('victoryRippleOverlay');
    let time = 0;

    function animate() {
      time += 0.05;
      const wave1 = Math.sin(time) * 5;
      const wave2 = Math.cos(time * 1.5) * 3;
      rippleOverlay.style.transform = `scale(${1 + Math.sin(time) * 0.02}) 
                                       translateX(${wave1}px) 
                                       translateY(${wave2}px)`;
      rippleAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopScreenRipple() {
    if (rippleAnimationId) {
      cancelAnimationFrame(rippleAnimationId);
      rippleAnimationId = null;
    }
    if (rippleOverlay) {
      rippleOverlay.style.transform = '';
      rippleOverlay.remove();
      rippleOverlay = null;
    }
  }

  // Effect 9: Particle Swirl
  let swirlCanvas, swirlCtx, swirlParticles = [], swirlAnimationId = null;

  function startParticleSwirl() {
    swirlCanvas = getOrCreateCanvas('victorySwirlCanvas');
    swirlCtx = swirlCanvas.getContext('2d');
    swirlParticles = [];

    const centerX = swirlCanvas.width / 2;
    const centerY = swirlCanvas.height / 2;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

    for (let i = 0; i < 100; i++) {
      swirlParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 200 + 50,
        speed: Math.random() * 0.02 + 0.01,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function animate() {
      swirlCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      swirlCtx.fillRect(0, 0, swirlCanvas.width, swirlCanvas.height);

      swirlParticles.forEach(p => {
        p.angle += p.speed;
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;

        swirlCtx.fillStyle = p.color;
        swirlCtx.beginPath();
        swirlCtx.arc(x, y, p.size, 0, Math.PI * 2);
        swirlCtx.fill();
      });

      swirlAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopParticleSwirl() {
    if (swirlAnimationId) {
      cancelAnimationFrame(swirlAnimationId);
      swirlAnimationId = null;
    }
    if (swirlCanvas) {
      swirlCanvas.remove();
      swirlCanvas = null;
    }
    swirlParticles = [];
  }

  // Effect 10: Gold Overlay
  let goldOverlay, goldAnimationId = null;

  function startGoldOverlay() {
    goldOverlay = getOrCreateOverlay('victoryGoldOverlay');
    let shimmer = 0;

    function animate() {
      shimmer += 0.03;
      const opacity = (Math.sin(shimmer) + 1) / 2 * 0.2 + 0.1;
      goldOverlay.style.background = `linear-gradient(
        ${shimmer * 50}deg,
        rgba(255, 215, 0, ${opacity}) 0%,
        rgba(255, 223, 0, ${opacity * 1.2}) 25%,
        rgba(255, 215, 0, ${opacity}) 50%,
        rgba(255, 223, 0, ${opacity * 1.2}) 75%,
        rgba(255, 215, 0, ${opacity}) 100%
      )`;
      goldAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopGoldOverlay() {
    if (goldAnimationId) {
      cancelAnimationFrame(goldAnimationId);
      goldAnimationId = null;
    }
    if (goldOverlay) {
      goldOverlay.remove();
      goldOverlay = null;
    }
  }

  // Effect 11: Camera Shake
  let shakeElement, shakeAnimationId = null;

  function startCameraShake() {
    shakeElement = document.body;
    let time = 0;

    function animate() {
      time += 0.1;
      const intensity = 3;
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      const rotation = (Math.random() - 0.5) * 0.5;
      
      shakeElement.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      shakeAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopCameraShake() {
    if (shakeAnimationId) {
      cancelAnimationFrame(shakeAnimationId);
      shakeAnimationId = null;
    }
    if (shakeElement) {
      shakeElement.style.transform = '';
      shakeElement = null;
    }
  }

  // Effect 12: Light Burst
  let burstCanvas, burstCtx, burstAnimationId = null;

  function startLightBurst() {
    burstCanvas = getOrCreateCanvas('victoryBurstCanvas');
    burstCtx = burstCanvas.getContext('2d');
    let time = 0;

    function animate() {
      time += 0.05;
      burstCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);

      const centerX = burstCanvas.width / 2;
      const centerY = burstCanvas.height / 2;
      const maxRadius = Math.max(burstCanvas.width, burstCanvas.height);

      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + time;
        const gradient = burstCtx.createLinearGradient(
          centerX, centerY,
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        );

        const hue = (time * 50 + i * 45) % 360;
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.3)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, 0.1)`);
        gradient.addColorStop(1, 'transparent');

        burstCtx.save();
        burstCtx.translate(centerX, centerY);
        burstCtx.rotate(angle);
        burstCtx.fillStyle = gradient;
        burstCtx.fillRect(0, -50, maxRadius, 100);
        burstCtx.restore();
      }

      burstAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopLightBurst() {
    if (burstAnimationId) {
      cancelAnimationFrame(burstAnimationId);
      burstAnimationId = null;
    }
    if (burstCanvas) {
      burstCanvas.remove();
      burstCanvas = null;
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  function getOrCreateCanvas(id) {
    let canvas = document.getElementById(id);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
    }
    return canvas;
  }

  function getOrCreateOverlay(id) {
    let overlay = document.getElementById(id);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = id;
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9998';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    const canvases = [confettiCanvas, sparklesCanvas, fireworksCanvas, starsCanvas, swirlCanvas, burstCanvas];
    canvases.forEach(canvas => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });
  });

  // ==================== EXPORT ====================

  window.VictoryManager = {
    playVictorySequence,
    stopVictorySequence,
    updateMuteState
  };

})(window);