require('dotenv').config()

const {S3} = require('aws-sdk')

, {endpoint, accessKeyId, secretAccessKey, Bucket} = process.env

, storage = new S3({endpoint, accessKeyId, secretAccessKey})

module.exports = (method, settings = {}) =>
	storage[method]({Bucket, ...settings}).promise()