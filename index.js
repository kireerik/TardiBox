require('dotenv').config()

const {buffer} = require('micro')

, {S3} = require('aws-sdk')

, {endpoint, accessKeyId, secretAccessKey} = process.env

, storage = new S3({endpoint, accessKeyId, secretAccessKey})

module.exports = async (request, response) => {
	if (request.method == 'PATCH')
		var upload = storage.upload({
			Bucket: 'delta2-8'
			, Key: request.headers['upload-name']
			, Body: await buffer(request)
		}).promise()

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

	if (upload)
		await upload

	return ''
}