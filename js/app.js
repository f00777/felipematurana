/**
 * ============================================================================
 * BIOS PERSONAL BLOG - FELIPE MATURANA
 * Multi-Page Vanilla JavaScript Architecture
 * Handles real-time RTC clock, Web Audio PC Speaker synthesizer,
 * keyboard navigation (arrows, Enter, ESC, 1-3), and localStorage preferences.
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Application State & LocalStorage Persistence
  // --------------------------------------------------------------------------
  const state = {
    menuIndex: 0,
    essayIndex: 0,
    soundEnabled: localStorage.getItem('bios_sound_enabled') !== 'false',
    crtEnabled: localStorage.getItem('bios_crt_enabled') !== 'false'
  };

  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const biosClock = document.getElementById('biosClock');
  const soundStatus = document.getElementById('soundStatus');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const crtStatus = document.getElementById('crtStatus');
  const crtToggleBtn = document.getElementById('crtToggleBtn');
  const backBtn = document.getElementById('backBtn');

  // Main menu page elements
  const mainMenuList = document.getElementById('mainMenuList');
  const menuItems = mainMenuList ? Array.from(mainMenuList.querySelectorAll('.menu-item')) : [];

  // Ensayos page elements
  const essayRows = Array.from(document.querySelectorAll('.essay-row'));

  // --------------------------------------------------------------------------
  // Synthesized PC Speaker Audio (Web Audio API)
  // --------------------------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playPcBeep(freq = 800, durationMs = 30, type = 'square') {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (durationMs / 1000));

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (durationMs / 1000));
    } catch {
      // Audio autoplay restrictions or silent fail
    }
  }

  const soundNav = () => playPcBeep(880, 25, 'square');
  const soundSelect = () => playPcBeep(1320, 50, 'square');
  const soundBack = () => playPcBeep(440, 45, 'triangle');

  // --------------------------------------------------------------------------
  // Real-Time Hardware Clock (RTC)
  // --------------------------------------------------------------------------
  function updateBiosClock() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (biosClock) {
      biosClock.textContent = `FECHA: ${dateStr}  HORA: ${timeStr}`;
    }
  }
  setInterval(updateBiosClock, 1000);
  updateBiosClock();

  // --------------------------------------------------------------------------
  // CRT Mode & Sound Initial Sync
  // --------------------------------------------------------------------------
  function applyCrtState() {
    if (state.crtEnabled) {
      document.body.classList.add('crt-enabled');
      if (crtStatus) crtStatus.textContent = 'ON';
    } else {
      document.body.classList.remove('crt-enabled');
      if (crtStatus) crtStatus.textContent = 'OFF';
    }
  }

  function toggleCrt() {
    state.crtEnabled = !state.crtEnabled;
    localStorage.setItem('bios_crt_enabled', state.crtEnabled);
    applyCrtState();
    soundNav();
  }

  function applySoundState() {
    if (soundStatus) {
      soundStatus.textContent = state.soundEnabled ? 'ON' : 'OFF';
      soundStatus.style.color = state.soundEnabled ? 'var(--bios-green)' : 'var(--bios-red)';
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('bios_sound_enabled', state.soundEnabled);
    applySoundState();
    if (state.soundEnabled) {
      playPcBeep(950, 40);
    }
  }

  applyCrtState();
  applySoundState();

  if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);
  if (crtToggleBtn) crtToggleBtn.addEventListener('click', toggleCrt);

  // --------------------------------------------------------------------------
  // Main Menu Navigation (index.html)
  // --------------------------------------------------------------------------
  function setMenuIndex(newIndex, playSound = true) {
    if (!menuItems.length) return;
    if (newIndex < 0) newIndex = menuItems.length - 1;
    if (newIndex >= menuItems.length) newIndex = 0;

    state.menuIndex = newIndex;

    menuItems.forEach((item, idx) => {
      if (idx === state.menuIndex) {
        item.classList.add('selected');
        item.focus();
      } else {
        item.classList.remove('selected');
      }
    });

    if (playSound) soundNav();
  }

  function activateCurrentMenuItem() {
    if (!menuItems.length) return;
    const currentItem = menuItems[state.menuIndex];
    if (currentItem) {
      soundSelect();
      setTimeout(() => {
        window.location.href = currentItem.getAttribute('href');
      }, 70);
    }
  }

  if (menuItems.length > 0) {
    menuItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        setMenuIndex(index, true);
      });

      item.addEventListener('click', (e) => {
        e.preventDefault();
        setMenuIndex(index, false);
        activateCurrentMenuItem();
      });
    });

    setMenuIndex(0, false);
  }

  // --------------------------------------------------------------------------
  // Ensayos Table Navigation (ensayos.html)
  // --------------------------------------------------------------------------
  function setEssayIndex(newIndex, playSound = true) {
    if (!essayRows.length) return;
    if (newIndex < 0) newIndex = essayRows.length - 1;
    if (newIndex >= essayRows.length) newIndex = 0;

    state.essayIndex = newIndex;

    essayRows.forEach((row, idx) => {
      if (idx === state.essayIndex) {
        row.classList.add('selected');
        row.focus();
      } else {
        row.classList.remove('selected');
      }
    });

    if (playSound) soundNav();
  }

  function activateCurrentEssayItem() {
    if (!essayRows.length) return;
    const currentRow = essayRows[state.essayIndex];
    if (currentRow) {
      const targetUrl = currentRow.getAttribute('data-href');
      if (targetUrl) {
        soundSelect();
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 70);
      }
    }
  }

  if (essayRows.length > 0) {
    essayRows.forEach((row, index) => {
      row.addEventListener('mouseenter', () => {
        setEssayIndex(index, true);
      });
      row.addEventListener('click', (e) => {
        e.preventDefault();
        setEssayIndex(index, false);
        activateCurrentEssayItem();
      });
    });

    setEssayIndex(0, false);
  }

  // Back button click with retro sound
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      soundBack();
      setTimeout(() => {
        window.location.href = backBtn.getAttribute('href');
      }, 70);
    });
  }

  // --------------------------------------------------------------------------
  // Global Keyboard Events Handler
  // --------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    // Sound toggle: 'M' or 'm'
    if (e.key === 'm' || e.key === 'M') {
      toggleSound();
      return;
    }

    // CRT toggle: 'C' or 'c'
    if (e.key === 'c' || e.key === 'C') {
      toggleCrt();
      return;
    }

    // Global ESC: activates backBtn if present
    if (e.key === 'Escape') {
      if (backBtn) {
        e.preventDefault();
        soundBack();
        setTimeout(() => {
          window.location.href = backBtn.getAttribute('href');
        }, 70);
        return;
      }
    }

    // Main Menu Page Keyboard Navigation
    if (menuItems.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenuIndex(state.menuIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenuIndex(state.menuIndex + 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activateCurrentMenuItem();
      } else if (e.key === '1') {
        soundSelect();
        setTimeout(() => { window.location.href = 'sobre-mi.html'; }, 70);
      } else if (e.key === '2') {
        soundSelect();
        setTimeout(() => { window.location.href = 'ensayos.html'; }, 70);
      } else if (e.key === '3') {
        soundSelect();
        setTimeout(() => { window.location.href = 'contacto.html'; }, 70);
      }
    }

    // Ensayos Page Keyboard Navigation
    if (essayRows.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEssayIndex(state.essayIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEssayIndex(state.essayIndex + 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activateCurrentEssayItem();
      }
    }
  });
});
