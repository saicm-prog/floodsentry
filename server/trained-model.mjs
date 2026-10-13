import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

const pythonScript = resolve('server/trained_model_predict.py')

export class TrainedModelError extends Error {}

function configured() {
  return process.env.FLOOD_SENTRY_MODEL_ENABLED === 'true'
}

export function trainedModelStatus() {
  return {
    enabled: configured(),
    modelPath: process.env.FLOOD_SENTRY_MODEL_PATH || resolve('models/Exp1_BestModel'),
    python: process.env.FLOOD_SENTRY_MODEL_PYTHON || 'python3',
    requestTypes: (process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES || '').split(',').map(value => value.trim()).filter(Boolean),
  }
}

/**
 * Internal integration point for request handlers that are explicitly mapped to
 * the trained model. It stays disabled until a request type and feature mapping
 * are configured, so the existing app never silently uses incompatible inputs.
 */
export async function deriveWithTrainedModel({ requestType, features, featureNames = [] } = {}) {
  if (!configured()) return { status: 'disabled', reason: 'FLOOD_SENTRY_MODEL_ENABLED is not true.' }
  if (typeof requestType !== 'string' || !requestType.trim()) throw new TrainedModelError('A model request type is required.')
  const requestTypes = trainedModelStatus().requestTypes
  if (!requestTypes.includes(requestType)) return { status: 'not_mapped', reason: `No trained-model mapping exists for request type: ${requestType}.` }
  if (!Array.isArray(features) || !features.length || features.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new TrainedModelError('The trained model requires a finite numeric feature vector.')
  if (featureNames.length && (!Array.isArray(featureNames) || featureNames.length !== features.length || featureNames.some(name => typeof name !== 'string' || !name.trim()))) throw new TrainedModelError('Feature names must match the numeric feature vector.')
  const modelPath = resolve(process.env.FLOOD_SENTRY_MODEL_PATH || 'models/Exp1_BestModel')
  try { await access(modelPath) } catch { throw new TrainedModelError(`Trained model file was not found at ${modelPath}.`) }
  const python = process.env.FLOOD_SENTRY_MODEL_PYTHON || 'python3'
  const input = JSON.stringify({ modelPath, features, featureNames })
  return await new Promise((resolveResult, reject) => {
    const child = spawn(python, [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''; let stderr = ''; let settled = false
    const finish = (callback, value) => { if (!settled) { settled = true; clearTimeout(timer); callback(value) } }
    const timer = setTimeout(() => { child.kill('SIGTERM'); finish(reject, new TrainedModelError('The trained model timed out.')) }, 30000)
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', error => finish(reject, new TrainedModelError(`Could not start the trained-model Python runtime: ${error.message}`)))
    child.on('close', code => {
      if (code !== 0) return finish(reject, new TrainedModelError(stderr.trim() || `The trained-model process exited with code ${code}.`))
      try { finish(resolveResult, JSON.parse(stdout)) } catch { finish(reject, new TrainedModelError('The trained-model process returned invalid JSON.')) }
    })
    child.stdin.end(input)
  })
}
