const PushoverEndpoint = 'https://api.pushover.net/1/messages.json'

type HearthookData = {
	id: string;
	timestamp: string;
	count: number;
	status: boolean
}

type PushoverMessageData = {
	token: string;
	user: string;
	message: string;
	attachment?: string;
	attachment_base64?: string;
	attachment_type?: string;
	device?: string;
	html?: number;
	priority?: -2 | -1 | 0 | 1 | 2;
	sound?: string;
	timestamp?: number;
	title?: string;
	ttl?: number;
	url?: string;
	url_title?: string;
}

const capitalize = <T extends string>(s: T) => (s[0].toUpperCase() + s.slice(1)) as Capitalize<typeof s>;

export async function pushover(env: Env, data: HearthookData): Promise<void> {

	console.log(`Pushover - ${JSON.stringify(data)}`)
	const time = formatLargestDifference(data.timestamp, Date.now())

	const message = data.status
		? `${capitalize(data.id)} has checked in after not being seen ${time} ago.`
		: `${capitalize(data.id)} has not send a heartbeat within the required interval. It was last seen ${time} ago.`

	let payload: Partial<PushoverMessageData> = {
		title: `${capitalize(data.id)} is ${data.status ? 'Up' : 'Down'}`,
		message,
		token: env.PUSHOVER_TOKEN,
		user: env.PUSHOVER_USER_KEY,
	}

	if (env.PUSHOVER_DEVICE) payload.device = env.PUSHOVER_DEVICE
	if (env.PUSHOVER_TTL) payload.ttl = env.PUSHOVER_TTL

	console.log(JSON.stringify(payload))
	const response = await fetch(PushoverEndpoint, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			"content-type": "application/json;charset=UTF-8",
		},
	})

	if (!response.ok) {
		const msg = await response.text()
		console.log(`Failed to send message: ${msg}`)
	}
}

export function formatLargestDifference(start: string, end: number): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMilliseconds = endDate.getTime() - startDate.getTime();

    const millisecondsInSecond = 1000;
    const millisecondsInMinute = millisecondsInSecond * 60;
    const millisecondsInHour = millisecondsInMinute * 60;
    const millisecondsInDay = millisecondsInHour * 24;
    const millisecondsInMonth = millisecondsInDay * 30; // Approximation
    const millisecondsInYear = millisecondsInDay * 365; // Approximation

    const years = Math.floor(diffInMilliseconds / millisecondsInYear);
    const months = Math.floor((diffInMilliseconds % millisecondsInYear) / millisecondsInMonth);
    const days = Math.floor((diffInMilliseconds % millisecondsInMonth) / millisecondsInDay);
    const hours = Math.floor((diffInMilliseconds % millisecondsInDay) / millisecondsInHour);
    const minutes = Math.floor((diffInMilliseconds % millisecondsInHour) / millisecondsInMinute);
    const seconds = Math.floor((diffInMilliseconds % millisecondsInMinute) / millisecondsInSecond);

    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}M`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    if (seconds > 0) return `${seconds}s`;

    return '0s'; // Handle the case where the difference is less than a second
}
