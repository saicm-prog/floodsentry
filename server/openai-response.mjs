export class SimulatorError extends Error {
  constructor(message, status = 502) { super(message); this.status = status }
}

export async function callStructuredModel({ apiKey, model, fetchImpl, stage, instructions, input, schema, webSearch = false }) {
  let response
  try {
    response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({
        model, store: false, instructions, input, max_output_tokens: 10000,
        text: { format: { type: 'json_schema', name: 'flood_sentry_result', strict: true, schema } },
        ...(webSearch ? { tools: [{ type: 'web_search' }], tool_choice: 'required', include: ['web_search_call.action.sources'] } : {}),
      }),
    })
  } catch (error) {
    throw new SimulatorError(`${stage}: ${['TimeoutError', 'AbortError'].includes(error.name) ? 'OpenAI timed out. Try again.' : 'Could not reach OpenAI. Check the server connection.'}`)
  }
  if (!response.ok) {
    const detail = response.status === 401 ? 'Check OPENAI_API_KEY in .env and restart the API.'
      : response.status === 429 ? 'OpenAI quota or rate limit reached. Check API billing or try later.'
      : [400, 403, 404].includes(response.status) ? `Check that OPENAI_MODEL supports Responses, structured outputs${webSearch ? ', and web search' : ''}, and that your API project has access.`
      : 'OpenAI is unavailable. Try again later.'
    throw new SimulatorError(`${stage}: ${detail} (HTTP ${response.status})`)
  }
  try {
    const payload = await response.json()
    if (payload.status !== 'completed') throw new Error('Incomplete')
    const output = payload.output || []
    const parts = output.filter(item => item.type === 'message').flatMap(item => item.content || [])
    if (parts.some(part => part.type === 'refusal')) throw new Error('Refused')
    const data = JSON.parse(parts.filter(part => part.type === 'output_text').map(part => part.text).join(''))
    const retrievedUrls = [...new Set([
      ...output.filter(item => item.type === 'web_search_call' && item.status === 'completed').flatMap(item => item.action?.sources || []).map(source => source.url),
      ...parts.flatMap(part => part.annotations || []).filter(annotation => annotation.type === 'url_citation').map(annotation => annotation.url),
    ].filter(url => typeof url === 'string'))]
    return { data, retrievedUrls }
  } catch { throw new SimulatorError(`${stage}: OpenAI returned an incomplete or unreadable result. No alerts were sent.`) }
}
