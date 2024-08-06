import { pushover } from "./pushover";

const PushoverEndpoint = 'https://api.pushover.net/1/messages.json'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const timestamp = Date.now()
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 })
		}

		const url = new URL(request.url)
		const [id, secret] = url.pathname.split('/').filter((part) => part)

		if (!id || !secret) {
			return new Response('Invalid request format. Must be in form of /:id/:secret', { status: 400 })
		}

		if (secret !== env.HEARTHOOK_SECRET) {
			return new Response('Invalid ID or Secret', { status: 403 })
		}

		const data = await env.HEARTHOOK_CHECKINS.get(id)
		if (data) {
			const { timestamp, count, status } = JSON.parse(data)
			if (!status) {
				await pushover(env, { id, timestamp, count, status })
			}
		}

		await env.HEARTHOOK_CHECKINS.put(id, JSON.stringify({ timestamp, count: 0, status: true }))
		return new Response('OK', { status: 200 })
	},
	async scheduled(event, env, ctx) {
		const list = await env.HEARTHOOK_CHECKINS.list()

		for (const key of list.keys) {
			const data = await env.HEARTHOOK_CHECKINS.get(key.name);
			if (!data) return;

			let { timestamp, count, status } = JSON.parse(data)

			if (!status) {
				await env.HEARTHOOK_CHECKINS.put(key.name, JSON.stringify({ timestamp, count: count++, status }))
				continue;
			}

			if ((Date.now() - parseInt(timestamp)) > (env.HEARTHOOK_INTERVAL * 60 * 1000)) {
				await env.HEARTHOOK_CHECKINS.put(key.name, JSON.stringify({ timestamp, count: count++, status: false }))
				await pushover(env, { id: key.name, timestamp, count, status })
			}
		}
	}
} satisfies ExportedHandler<Env>;
