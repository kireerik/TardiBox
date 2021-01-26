const {randomBytes} = require('crypto')

, useStorage = require('./storage')

, use = (method, Key, settings = {}) =>
	useStorage(method, {Key, ...settings})

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
				!maximumdownloadcount || (await useStorage('listObjects', {
					Prefix: downloadCountFolder
				})).Contents.length - 1 < maximumdownloadcount
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

			use(
				'upload'
				, downloadCountFolder + randomBytes(16).toString('hex')
				, {Body: ''}
			)

			for (let i = 0; i < contentlength; i += ContentLength) {
				var {Body, ContentLength} = await use('getObject', fileFolder  + 'part' + '/' + i)

				response.write(Body)
			}
		} else
			response.statusCode = 403

	response.end()
}