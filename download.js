const {randomBytes} = require('crypto')

, {storage, Bucket} = require('./storage')

, use = async (method, Key) =>
	await storage[method]({Bucket, Key}).promise()

module.exports = async (request, response) => {
	const fileName = request.url.substring(1)
	, fileFolder = fileName + '/'
	, downloadCountFolder = fileFolder + 'downloadCount' + '/'

	var fileExists = false

	try {
		var {
			ContentType, Metadata: {
				contentlength

				, maximumdownloadcount, expirydateandtime
			}
		} =
			await use('headObject', fileFolder)

		fileExists = true
	} catch (error) {
		if (error.code == 'NotFound')
			response.statusCode = 404
		else
			throw error
	}

	if (fileExists)
		if (
			(
				!maximumdownloadcount || (await storage.listObjects({
					Bucket
					, Prefix: downloadCountFolder
				}).promise()).Contents.length - 1 < maximumdownloadcount
			) && (
				!expirydateandtime || new Date() < new Date(expirydateandtime)
			)
		) {
			[
				['Content-Type', ContentType]
				, ['Content-Disposition', 'filename="' + fileName + '"']
			].forEach(header =>
				response.setHeader(...header)
			)

			storage.upload({
				Bucket
				, Key: downloadCountFolder + randomBytes(16).toString('hex')
				, Body: ''
			}).promise()

			for (let i = 0; i < contentlength; i += ContentLength) {
				var {Body, ContentLength} = await use('getObject', fileFolder  + 'part' + '/' + i)

				response.write(Body)
			}
		} else
			response.statusCode = 403

	response.end()
}