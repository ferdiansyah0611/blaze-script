import { mount } from '@blaze'

export default function MediaQuery(query: string, callback: Function, component){
	const media = window.matchMedia(query)
	const handle = (e) => {
		if(typeof callback === 'function') {
			callback(e.matches)
		}
	}
	mount(() => {
		handle(media)

		media.addEventListener('change', handle)
		component.$deep.unmount.push(() => {
			media.removeEventListener('change', handle)
		})
	}, component)
}