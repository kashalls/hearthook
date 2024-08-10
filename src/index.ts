import { pushover } from "./pushover";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'GET') {
			const { pathname, searchParams } = new URL(request.url)
			const [id] = pathname.split('/').filter((part) => part)
			if (!id || id.includes('.ico')) return new Response(JSON.stringify({ error: "id is not valid" }), { status: 400 })
				
			const data = await env.HEARTHOOK_CHECKINS.get(id)
			if (!data) return new Response(JSON.stringify({ error: "id is not valid" }), { status: 400 })

			const { status } = JSON.parse(data)

			const genericMessage = status ? "Up" : "Down"
			const message = searchParams.has(`message${genericMessage}`) ? searchParams.get(`message${genericMessage}`) : genericMessage
			const color = searchParams.has(`color${genericMessage}`) ? searchParams.get(`color${genericMessage}`) : (status ? "green" : "red")

			return new Response(JSON.stringify({
				schemaVersion: 1,
				label: searchParams.has("label") ? searchParams.get("label") : id,
				message, color
			}), {
				status: 200
			})
		}

		if (request.method === 'POST') {
			const url = new URL(request.url)
			const [id, secret] = url.pathname.split('/').filter((part) => part)

			if (!id || !secret) {
				return new Response('Invalid request format. Must be in form of /:id/:secret', { status: 400 })
			}

			if (secret !== env.HEARTHOOK_SECRET) {
				return new Response('Invalid ID or Secret', { status: 403 })
			}

			const data = await env.HEARTHOOK_CHECKINS.get(id)
			console.log(`HTTP - ${id}, ${data}`)
			if (data) {
				const { timestamp, count, status } = JSON.parse(data)
				console.log(`${id} Checkin: ${new Date().toISOString()} - ${new Date(timestamp).toISOString()}`)
				if (!status) {
					//
					await pushover(env, { id, timestamp, count, status: true })
				}
			}

			await env.HEARTHOOK_CHECKINS.put(id, JSON.stringify({ timestamp: Date.now(), count: 0, status: true }))
			return new Response('OK', { status: 200 })
		}
		return new Response('Method not allowed', { status: 405 })
	},
	async scheduled(event, env, ctx) {
		const list = await env.HEARTHOOK_CHECKINS.list()

		console.log(list)

		for (const key of list.keys) {
			const data = await env.HEARTHOOK_CHECKINS.get(key.name);
			console.log(key.name, data)
			if (!data) return;

			const { timestamp, count, status } = JSON.parse(data)
			const newCount = count + 1;
			if (!status) {
				console.log(`Increasing down counter for ${key.name}...`)
				await env.HEARTHOOK_CHECKINS.put(key.name, JSON.stringify({ timestamp, count: newCount, status: false }))
				continue;
			}

			console.log(`${key.name}: ${Date.now()} ${timestamp} ${parseInt(env.HEARTHOOK_INTERVAL)} ${parseInt(env.HEARTHOOK_INTERVAL) * 60 * 1000}
				${parseInt(env.HEARTHOOK_GRACEPERIOD)} ${parseInt(env.HEARTHOOK_GRACEPERIOD) * 60 * 1000}`)
			console.log(`${key.name}: ${((parseInt(env.HEARTHOOK_INTERVAL) * 60 * 1000) + (parseInt(env.HEARTHOOK_GRACEPERIOD) * 60 * 1000))} ${((Date.now() - parseInt(timestamp)) > ((parseInt(env.HEARTHOOK_INTERVAL) * 60 * 1000) + (parseInt(env.HEARTHOOK_GRACEPERIOD) * 60 * 1000)))}`)

			if ((Date.now() - parseInt(timestamp)) > ((parseInt(env.HEARTHOOK_INTERVAL) * 60 * 1000) + (parseInt(env.HEARTHOOK_GRACEPERIOD) * 60 * 1000))) {
				console.log(`Marking ${key.name} as down...`)
				await env.HEARTHOOK_CHECKINS.put(key.name, JSON.stringify({ timestamp, count: newCount, status: false }))
				await pushover(env, { id: key.name, timestamp, count, status: false })
			}
		}
	}
} satisfies ExportedHandler<Env>;
