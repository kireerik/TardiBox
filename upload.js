const {URLSearchParams} = require('url')

, {buffer} = require('micro')

, {lookup} = require('mime-types')

, {storage, Bucket} = require('./storage')

, upload = (Key, Body, settings = {}) =>
	storage.upload({Bucket, Key, Body, ...settings}).promise()

module.exports = async (request, response) => {
	if (request.method == 'PATCH') {
		var uploads = []

		if (request.headers['upload-offset'] == 0) {
			const {maximumDownloadCount, expiryDateAndTime} = Array.from(
				new URLSearchParams(request.url.replace('/?', '')).entries()
			).reduce((result, [name, value]) => ({
				...result, [name]: value
			}), {})

			uploads.push(
				upload(
					request.headers['upload-name'] + '/'
					, ''
					, {
						...(() => {
							const ContentType = lookup(request.headers['upload-name'])

							return ContentType ? {ContentType} : {}
						})()
						, Metadata: {
							contentLength: request.headers['upload-length']

							, ...[
								['maximumDownloadCount', maximumDownloadCount]
								, ['expiryDateAndTime', expiryDateAndTime]
							].reduce((result, [name, value]) => {
								if (value)
									result[name] = value

								return result
							}, {})
						}
					}
				)
			)
		}

		uploads.push(
			upload(
				request.headers['upload-name'] + '/' + request.headers['upload-offset']
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