import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as ort from 'onnxruntime-node'

const defaultModelPath = resolve('models/Exp1_BestModel.onnx')
let sessionPromise

export class TrainedModelError extends Error {}
const configured = () => process.env.FLOOD_SENTRY_MODEL_ENABLED === 'true'

export function trainedModelStatus() {
  return { enabled: configured(), modelPath: process.env.FLOOD_SENTRY_MODEL_PATH || defaultModelPath, requestTypes: (process.env.FLOOD_SENTRY_MODEL_REQUEST_TYPES || '').split(',').map(value => value.trim()).filter(Boolean) }
}

async function loadSession(modelPath) {
  if (!sessionPromise) sessionPromise = ort.InferenceSession.create(modelPath)
  try { return await sessionPromise } catch (error) { sessionPromise = undefined; throw new TrainedModelError(`Could not load the ONNX model: ${error.message}`) }
}

export async function deriveWithTrainedModel({ requestType, features, featureNames = [] } = {}) {
  if (!configured()) return { status: 'disabled', reason: 'FLOOD_SENTRY_MODEL_ENABLED is not true.' }
  if (typeof requestType !== 'string' || !requestType.trim()) throw new TrainedModelError('A model request type is required.')
  if (!trainedModelStatus().requestTypes.includes(requestType)) return { status: 'not_mapped', reason: `No trained-model mapping exists for request type: ${requestType}.` }
  if (!Array.isArray(features) || features.length !== 14 || features.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new TrainedModelError('This ONNX model requires exactly 14 finite numeric features in training order.')
  if (featureNames.length && (!Array.isArray(featureNames) || featureNames.length !== features.length || featureNames.some(name => typeof name !== 'string' || !name.trim()))) throw new TrainedModelError('Feature names must match the numeric feature vector.')
  const modelPath = resolve(process.env.FLOOD_SENTRY_MODEL_PATH || defaultModelPath)
  try { await access(modelPath) } catch { throw new TrainedModelError(`ONNX model file was not found at ${modelPath}.`) }
  const session = await loadSession(modelPath)
  const input = new ort.Tensor('float32', Float32Array.from(features), [1, features.length])
  try {
    // The exported classifier includes a ZipMap probability output. Requesting
    // the scalar label only keeps inference compatible with onnxruntime-node.
    const output = await session.run({ [session.inputNames[0]]: input }, ['output_label'])
    const label = output.output_label?.data?.[0]
    return { status: 'predicted', prediction: typeof label?.item === 'function' ? label.item() : label }
  } catch (error) { throw new TrainedModelError(`ONNX inference failed: ${error.message}`) }
}
