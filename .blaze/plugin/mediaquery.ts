export default function MediaQuery(query, callback, component){
	const media = window.matchMedia(query)
	const handle = (e) => {
		if(typeof callback === 'function') {
			callback(e.matches)
		}
	}
	media.addEventListener('change', handle)

	component.$deep.unmount.push(() => {
		media.removeEventListener('change', handle)
	})
}