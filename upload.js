const {URLSearchParams} = require('url')

, {buffer} = require('micro')

, {lookup} = require('mime-types')

, {upload} = require('./storage')

, getProperties = (...parameters) =>
	parameters.reduce((result, [name, value]) => {
		if (value)
			result[name] = value

		return result
	}, {})

module.exports = async (request, response) => {
	if (request.method == 'PATCH') {
		var uploads = []

		const fileFolder = request.headers['upload-name'] + '/'

		if (request.headers['upload-offset'] == 0) {
			const {maximumDownloadCount, expiryDateAndTime} = Array.from(
				new URLSearchParams(request.url.replace('/?', '')).entries()
			).reduce((result, [name, value]) => ({
				...result, [name]: value
			}), {})

			uploads.push(
				upload(fileFolder, undefined, {
					...getProperties([
						'ContentType', lookup(request.headers['upload-name'])
					])
					, Metadata: {
						contentLength: request.headers['upload-length']

						, ...getProperties(
							['maximumDownloadCount', maximumDownloadCount]
							, ['expiryDateAndTime', expiryDateAndTime]
						)
					}
				})
				, upload(fileFolder + 'downloadCount' + '/')
			)
		}

		uploads.push(
			upload(
				fileFolder + 'part' + '/' + request.headers['upload-offset']
				, await buffer(request)
			)
		)
	}

	[
		['Access-Control-Allow-Origin', '*']

		, ...(request.method == 'OPTIONS' ? [
			, ['Access-Control-Allow-Methods', 'PATCH']
			, ['Access-Control-Allow-Headers', [
				'Content-Type'
				, 'Upload-Length'
				, 'Upload-Name'
				, 'Upload-Offset'
			]]
			, ['Access-Control-Max-Age', 7200]
		] : [])
	].forEach(header =>
		header &&
			response.setHeader(...header)
	)

	if (uploads)
		await Promise.all(uploads)

	response.end()
}