require('dotenv').config()

const {S3} = require('aws-sdk')

, {endpoint, accessKeyId, secretAccessKey, Bucket} = process.env

module.exports = {
	storage: new S3({endpoint, accessKeyId, secretAccessKey}), Bucket
}