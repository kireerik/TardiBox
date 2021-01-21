require('dotenv').config()

const {buffer} = require('micro')

, {S3} = require('aws-sdk')

, {endpoint, accessKeyId, secretAccessKey, Bucket} = process.env

, storage = new S3({endpoint, accessKeyId, secretAccessKey})

, upload = (Key, Body, settings = {}) =>
	storage.upload({Bucket, Key, Body, ...settings}).promise()

module.exports = async (request, response) => {
	if (request.method == 'PATCH') {
		var uploads = []

		if (request.headers['upload-offset'] == 0)
			uploads.push(
				upload(
					request.headers['upload-name'] + '/'
					, ''
					, {
						Metadata: {
							contentLength: request.headers['upload-length']
						}
					}
				)
			)

		uploads.push(
			upload(
				request.headers['upload-name'] + '/' + request.headers['upload-offset']
				, await buffer(request)
			)
		)
	}

	const isOptionsRequest = request.method == 'OPTIONS'

	;[
		['Access-Control-Allow-Origin', '*']

		, ...(isOptionsRequest ? [
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

	return ''
}