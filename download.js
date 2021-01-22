const {storage, Bucket} = require('./storage')

use = async (method, Key) =>
	await storage[method]({Bucket, Key}).promise()

module.exports = async (request, response) => {
	const fileName = request.url.substring(1)
	, fileFolder = fileName + '/'

	, {
		ContentType, Metadata: {contentlength}
	} =
		await use('headObject', fileFolder)

	;[
		['Content-Type', ContentType]
		, ['Content-Disposition', 'filename="' + fileName + '"']
	].forEach(header =>
		response.setHeader(...header)
	)

	for (let i = 0; i < contentlength; i += ContentLength) {
		var {Body, ContentLength} = await use('getObject', fileFolder + i)

		response.write(Body)
	}

	response.end()
}