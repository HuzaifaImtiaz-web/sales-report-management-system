const { BrowserWindow, app, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger.cjs');

function getStateFilePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const defaultState = {
    width: 1280,
    height: 800,
    x: undefined,
    y: undefined
  };

  try {
    const stateFilePath = getStateFilePath();
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.x !== undefined && parsed.y !== undefined) {
        const bounds = { x: parsed.x, y: parsed.y, width: parsed.width, height: parsed.height };
        const display = screen.getDisplayMatching(bounds);
        const visible = display ? display.workArea : null;
        
        if (
          visible &&
          parsed.x >= visible.x - 50 &&
          parsed.y >= visible.y - 50 &&
          parsed.x + parsed.width <= visible.x + visible.width + 50 &&
          parsed.y + parsed.height <= visible.y + visible.height + 50
        ) {
          return parsed;
        }
      }
    }
  } catch (e) {
    logger.warn('Failed to parse saved window state, falling back to defaults.');
  }

  return defaultState;
}

function saveWindowState(window) {
  try {
    if (!window.isDestroyed() && !window.isMaximized() && !window.isMinimized()) {
      const bounds = window.getBounds();
      const stateFilePath = getStateFilePath();
      const stateDir = path.dirname(stateFilePath);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(stateFilePath, JSON.stringify(bounds), 'utf8');
    }
  } catch (e) {
    logger.warn('Failed to save window state.');
  }
}

function createMainWindow(preloadPath) {
  const state = loadWindowState();
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 768,
    icon: fs.existsSync(path.join(__dirname, '../build/icon.png'))
      ? path.join(__dirname, '../build/icon.png')
      : path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Himmel Sales Management',
    show: false
  });

  if (state.x === undefined || state.y === undefined) {
    mainWindow.center();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const saveState = () => saveWindowState(mainWindow);
  mainWindow.on('resize', saveState);
  mainWindow.on('move', saveState);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5180');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

module.exports = {
  createMainWindow
};
