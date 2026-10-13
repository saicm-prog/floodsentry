import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveWithTrainedModel, trainedModelStatus, TrainedModelError } from './trained-model.mjs'

test('trained model integration is disabled by default', async () => { const result = await deriveWithTrainedModel({ requestType: 'damage-risk', features: Array(14).fill(1) }); assert.equal(result.status, 'disabled'); assert.equal(trainedModelStatus().enabled, false) })
test('unsupported request types do not invoke the model', async () => {
  const previous = process.env.FLOOD_SENTRY_MODEL_ENABLED; const mapped = process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES
  process.env.FLOOD_SENTRY_MODEL_ENABLED = 'true'; process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = 'damage-risk'
  try { const result = await deriveWithTrainedModel({ requestType: 'weather-summary', features: Array(14).fill(1) }); assert.equal(result.status, 'not_mapped') }
  finally { if (previous === undefined) delete process.env.FLOOD_SENTRY_MODEL_ENABLED; else process.env.FLOOD_SENTRY_MODEL_ENABLED = previous; if (mapped === undefined) delete process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES; else process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = mapped }
})
test('mapped calls validate the ONNX feature shape', async () => {
  const previous = process.env.FLOOD_SENTRY_MODEL_ENABLED; const mapped = process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES
  process.env.FLOOD_SENTRY_MODEL_ENABLED = 'true'; process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = 'damage-risk'
  try { await assert.rejects(deriveWithTrainedModel({ requestType: 'damage-risk', features: [1, 2] }), TrainedModelError); await assert.rejects(deriveWithTrainedModel({ requestType: 'damage-risk', features: [...Array(13).fill(1), Number.NaN] }), TrainedModelError) }
  finally { if (previous === undefined) delete process.env.FLOOD_SENTRY_MODEL_ENABLED; else process.env.FLOOD_SENTRY_MODEL_ENABLED = previous; if (mapped === undefined) delete process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES; else process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = mapped }
})
test('ONNX model returns a prediction directly from Node.js', async () => {
  const previous = process.env.FLOOD_SENTRY_MODEL_ENABLED; const mapped = process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES
  delete process.env.FLOOD_SENTRY_MODEL_PATH; process.env.FLOOD_SENTRY_MODEL_ENABLED = 'true'; process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = 'damage-risk'
  try { const result = await deriveWithTrainedModel({ requestType: 'damage-risk', features: Array(14).fill(0) }); assert.equal(result.status, 'predicted'); assert.ok([0, 1].includes(Number(result.prediction))) }
  finally { if (previous === undefined) delete process.env.FLOOD_SENTRY_MODEL_ENABLED; else process.env.FLOOD_SENTRY_MODEL_ENABLED = previous; if (mapped === undefined) delete process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES; else process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = mapped }
})
