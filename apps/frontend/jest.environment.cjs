const Module = require('module');

const originalResolveFilename = Module._resolveFilename;

const resolveWithoutCanvas = function resolveWithoutCanvas(request) {
  if (request === 'canvas') {
    const error = new Error("Cannot find module 'canvas'");
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }

  return originalResolveFilename.apply(this, arguments);
};

const { TestEnvironment } = require('jest-environment-jsdom');

module.exports = class FrontendJSDOMEnvironment extends TestEnvironment {
  constructor(config, context) {
    Module._resolveFilename = resolveWithoutCanvas;

    try {
      super(config, context);
    } finally {
      Module._resolveFilename = originalResolveFilename;
    }
  }
};
