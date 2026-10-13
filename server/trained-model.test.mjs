import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveWithTrainedModel, trainedModelStatus, TrainedModelError } from './trained-model.mjs'

test('trained model integration is disabled by default', async () => {
  const result = await deriveWithTrainedModel({ requestType: 'damage-risk', features: [1, 2] })
  assert.equal(result.status, 'disabled')
  assert.equal(trainedModelStatus().enabled, false)
})

test('unsupported request types do not invoke the model', async () => {
  const previous = process.env.FLOOD_SENTRY_MODEL_ENABLED
  const mapped = process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES
  process.env.FLOOD_SENTRY_MODEL_ENABLED = 'true'
  process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = 'damage-risk'
  try {
    const result = await deriveWithTrainedModel({ requestType: 'weather-summary', features: [1, 2] })
    assert.equal(result.status, 'not_mapped')
  } finally {
    if (previous === undefined) delete process.env.FLOOD_SENTRY_MODEL_ENABLED; else process.env.FLOOD_SENTRY_MODEL_ENABLED = previous
    if (mapped === undefined) delete process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES; else process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = mapped
  }
})

test('mapped calls validate features before starting Python', async () => {
  const previous = process.env.FLOOD_SENTRY_MODEL_ENABLED
  const mapped = process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES
  process.env.FLOOD_SENTRY_MODEL_ENABLED = 'true'
  process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = 'damage-risk'
  try {
    await assert.rejects(deriveWithTrainedModel({ requestType: 'damage-risk', features: ['not-a-number'] }), TrainedModelError)
  } finally {
    if (previous === undefined) delete process.env.FLOOD_SENTRY_MODEL_ENABLED; else process.env.FLOOD_SENTRY_MODEL_ENABLED = previous
    if (mapped === undefined) delete process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES; else process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES = mapped
  }
})
