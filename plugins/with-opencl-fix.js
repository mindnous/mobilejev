// Works around a llama.cpp OpenCL bug on Adreno GPUs (found with test-backend-ops on an
// Adreno 830): the "coopk dp4a" kernel that multiplies Q4_K weights by 2-4 tokens gives
// wrong results, so models like Qwen3.5 Q4_K_M answer garbage on the GPU.
// GGML_OPENCL_COOPK_DP4A=0 turns that kernel off. llama.cpp reads it once, when the
// GPU is first used, so it is set as soon as the app starts.
const { withMainApplication } = require('expo/config-plugins');

const LINE = 'android.system.Os.setenv("GGML_OPENCL_COOPK_DP4A", "0", true)';

module.exports = function withOpenclFix(config) {
  return withMainApplication(config, (config) => {
    if (!config.modResults.contents.includes(LINE)) {
      config.modResults.contents = config.modResults.contents.replace(
        'super.onCreate()',
        `super.onCreate()\n    ${LINE}`
      );
    }
    return config;
  });
};
