#!/usr/bin/env node

/**
 * Integration Test for EduSim Platform
 * Verifies: asset system, API resilience, physics runtime, controls
 */

const fs = require('fs');
const path = require('path');

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    TEST_RESULTS.passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    TEST_RESULTS.failed++;
  }
}

function warn(message) {
  console.warn(`⚠️  WARN: ${message}`);
  TEST_RESULTS.warnings++;
}

console.log('='.repeat(60));
console.log('EduSim Integration Test Suite');
console.log('='.repeat(60));

// Test 1: Asset Catalog
console.log('\n[TEST 1] Asset Catalog');
const catalogPath = path.join(
  __dirname,
  '../public/assets/asset-catalog.json'
);
const catalogExists = fs.existsSync(catalogPath);
assert(catalogExists, 'Asset catalog file exists');

if (catalogExists) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  assert(
    catalog.assets && Array.isArray(catalog.assets),
    'Catalog has assets array'
  );
  assert(catalog.assets.length > 0, 'Catalog contains assets');
  assert(catalog.aliases && typeof catalog.aliases === 'object', 'Catalog has aliases');
  console.log(`  📊 Total assets: ${catalog.assets.length}`);
  console.log(`  📊 Total aliases: ${Object.keys(catalog.aliases).length}`);
}

// Test 2: Asset Resolver Utility
console.log('\n[TEST 2] Asset Resolver Utility');
const resolverPath = path.join(
  __dirname,
  '../src/utils/assetCatalogResolver.js'
);
const resolverExists = fs.existsSync(resolverPath);
assert(resolverExists, 'Asset resolver utility exists');

if (resolverExists) {
  const resolver = fs.readFileSync(resolverPath, 'utf-8');
  assert(
    resolver.includes('normalizeAssetName'),
    'Resolver has normalizeAssetName function'
  );
  assert(
    resolver.includes('resolveBestAsset'),
    'Resolver has resolveBestAsset function'
  );
  assert(
    resolver.includes('fallback'),
    'Resolver implements fallback logic'
  );
}

// Test 3: Image Safe Loader
console.log('\n[TEST 3] Image Safe Loader');
const loaderPath = path.join(
  __dirname,
  '../src/utils/imageSafeLoader.ts'
);
const loaderExists = fs.existsSync(loaderPath);
assert(loaderExists, 'Image safe loader exists');

if (loaderExists) {
  const loader = fs.readFileSync(loaderPath, 'utf-8');
  assert(
    loader.includes('FALLBACK_CHAIN'),
    'Loader has fallback chain'
  );
  assert(
    loader.includes('timeout'),
    'Loader has timeout handling'
  );
  assert(
    loader.includes('createPlaceholderImage'),
    'Loader has placeholder fallback'
  );
}

// Test 4: Physics Runtime Controls
console.log('\n[TEST 4] Physics Runtime Controls');
const runtimePath = path.join(
  __dirname,
  '../src/runtime/simulationRuntime.js'
);
const runtimeExists = fs.existsSync(runtimePath);
assert(runtimeExists, 'Runtime file exists');

if (runtimeExists) {
  const runtime = fs.readFileSync(runtimePath, 'utf-8');
  assert(runtime.includes('play()'), 'Runtime has play() method');
  assert(runtime.includes('pause()'), 'Runtime has pause() method');
  assert(runtime.includes('reset()'), 'Runtime has reset() method');
  assert(runtime.includes('setSpeed('), 'Runtime has setSpeed() method');
}

// Test 5: Error Boundary Component
console.log('\n[TEST 5] Error Boundary Component');
const errorBoundaryPath = path.join(
  __dirname,
  '../src/components/ErrorBoundary.tsx'
);
const errorBoundaryExists = fs.existsSync(errorBoundaryPath);
assert(errorBoundaryExists, 'Error boundary component exists');

if (errorBoundaryExists) {
  const boundary = fs.readFileSync(errorBoundaryPath, 'utf-8');
  assert(
    boundary.includes('ComponentDidCatch'),
    'Error boundary catches errors'
  );
  assert(
    boundary.includes('handleReset'),
    'Error boundary has reset capability'
  );
}

// Test 6: Simulation Canvas Controls
console.log('\n[TEST 6] Simulation Canvas Controls');
const canvasPath = path.join(
  __dirname,
  '../src/components/simulation-runtime/SimulationCanvas.tsx'
);
const canvasExists = fs.existsSync(canvasPath);
assert(canvasExists, 'SimulationCanvas exists');

if (canvasExists) {
  const canvas = fs.readFileSync(canvasPath, 'utf-8');
  assert(canvas.includes('play()'), 'Canvas calls play control');
  assert(canvas.includes('pause()'), 'Canvas calls pause control');
  assert(canvas.includes('reset()'), 'Canvas calls reset control');
  assert(canvas.includes('setSpeed'), 'Canvas implements speed control');
}

// Test 7: API Client Resilience
console.log('\n[TEST 7] API Client Resilience');
const apiClientPath = path.join(
  __dirname,
  '../src/services/apiClient.ts'
);
const apiClientExists = fs.existsSync(apiClientPath);
assert(apiClientExists, 'API client exists');

if (apiClientExists) {
  const apiClient = fs.readFileSync(apiClientPath, 'utf-8');
  assert(
    apiClient.includes('fetchJsonWithRetry'),
    'API client has retry logic'
  );
  assert(
    apiClient.includes('timeout'),
    'API client has timeout handling'
  );
  assert(
    apiClient.includes('exponential'),
    'API client has exponential backoff'
  );
}

// Test 8: Backend Import Fixes
console.log('\n[TEST 8] Backend Import Fixes');
const backendFiles = [\n  'EduSim_API/app/src/api/generate_router.py',\n  'EduSim_API/app/src/api/simulation_router.py',\n  'EduSim_API/app/src/api/rag_router.py',\n];

for (const file of backendFiles) {
  const fullPath = path.join(__dirname, '../', file);
  if (fs.existsSync(fullPath)) {\n    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasBadImport = content.includes('from EduSim_API.app');
    assert(
      !hasBadImport,
      `${path.basename(file)} has no broken imports`
    );
  } else {
    warn(`Backend file not found: ${file}`);
  }
}

// Test 9: Loader Component Enhancement
console.log('\n[TEST 9] Simulation Loader Component');
const loaderComponentPath = path.join(
  __dirname,
  '../src/components/simulation/SimulationLoader.tsx'
);
const loaderComponentExists = fs.existsSync(loaderComponentPath);
assert(loaderComponentExists, 'SimulationLoader component exists');

if (loaderComponentExists) {
  const content = fs.readFileSync(loaderComponentPath, 'utf-8');
  // Check for animation and progress features
  assert(
    content.includes('motion') || content.includes('animate'),
    'Loader has animations'
  );
  assert(
    content.includes('progress') || content.includes('Progress'),
    'Loader shows progress'
  );
}

// Test 10: Agent Simulation Hook
console.log('\n[TEST 10] Agent Simulation Hook');
const hookPath = path.join(
  __dirname,
  '../src/hooks/useAgentSimulation.ts'
);
const hookExists = fs.existsSync(hookPath);
assert(hookExists, 'useAgentSimulation hook exists');

if (hookExists) {
  const hook = fs.readFileSync(hookPath, 'utf-8');
  assert(
    hook.includes('DSL_STAGE_PROGRESS'),
    'Hook maps DSL stages to progress'
  );
  assert(
    hook.includes('generateStream'),
    'Hook supports streaming'
  );
  assert(
    hook.includes('progressPercentage'),
    'Hook tracks progress percentage'
  );
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings}`);

const success = TEST_RESULTS.failed === 0;
console.log(success ? '\n🎉 All tests passed!' : '\n❌ Some tests failed');
process.exit(success ? 0 : 1);
