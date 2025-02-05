import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW_SETTINGS_KEY, type WindowSettings } from '../types.js';
import { handleSaveWindowSettings } from './save-window-settings.js';

// Mock Figma API
const mocks = vi.hoisted(() => ({
  clientStorage: {
    getAsync: vi.fn(),
    setAsync: vi.fn(),
  },
  resize: vi.fn(),
}));

// @ts-expect-error - Mocking global figma object
global.figma = {
  clientStorage: mocks.clientStorage,
  ui: {
    // Mock the resize function using string concatenation
    // to match the production code's Vite workaround
    ['re' + 'size']: mocks.resize,
  },
};

describe('Save Window Settings', () => {
  const defaultSettings: WindowSettings = {
    width: 300,
    height: 200,
    minimized: false,
    toolbarEnabled: true,
  };

  beforeEach(() => {
    mocks.clientStorage.getAsync.mockResolvedValue(defaultSettings);
    mocks.clientStorage.setAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should save new window settings', async () => {
    const newSettings = {
      width: 400,
      height: 300,
    };

    await handleSaveWindowSettings({
      event: handleSaveWindowSettings.EVENT_NAME,
      data: newSettings,
    });

    expect(mocks.resize).toHaveBeenCalledWith(400, 341); // height + 41 for toolbar
    expect(mocks.clientStorage.setAsync).toHaveBeenCalledWith(
      WINDOW_SETTINGS_KEY,
      expect.objectContaining(newSettings),
    );
  });

  it('should handle missing data', async () => {
    await handleSaveWindowSettings({
      event: handleSaveWindowSettings.EVENT_NAME,
    });

    expect(mocks.resize).not.toHaveBeenCalled();
    expect(mocks.clientStorage.setAsync).not.toHaveBeenCalled();
  });

  it('should handle settings without height change', async () => {
    await handleSaveWindowSettings({
      event: handleSaveWindowSettings.EVENT_NAME,
      data: { width: 400 },
    });

    expect(mocks.resize).not.toHaveBeenCalled();
    expect(mocks.clientStorage.setAsync).toHaveBeenCalledWith(
      WINDOW_SETTINGS_KEY,
      expect.objectContaining({ width: 400 }),
    );
  });
});
