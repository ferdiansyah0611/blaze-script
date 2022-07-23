import Component from '@blaze.d'

export default function MediaQuery(query: stirng, callback: Function, component: Component){
	const media = window.matchMedia(query)
	const handle = (e) => {
		if(typeof callback === 'function') {
			callback(e.matches)
		}
	}

	handle(media)

	media.addEventListener('change', handle)
	component.$deep.unmount.push(() => {
		media.removeEventListener('change', handle)
	})
}