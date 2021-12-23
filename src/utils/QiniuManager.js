const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
    constructor( accessKey, secretKey, bucket) {
        this.mac =  new qiniu.auth.digest.Mac(accessKey, secretKey)
        this.bucket = bucket
        this.config = new qiniu.conf.Config();
        this.config.zone = qiniu.zone.Zone_z0;
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    uploadFile( key, localFilePath){
        const options = {
            scope: this.bucket + ":" + key,
        }
        const putPolicy = new qiniu.rs.PutPolicy(options)
        const uploadToken = putPolicy.uploadToken(this.mac)
        const formUploader = new qiniu.form_up.FormUploader(this.config)
        const putExtra = new qiniu.form_up.PutExtra()
        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this.__handleCallback( resolve, reject ));
        })
    }

    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this.__handleCallback( resolve, reject ))
        })
    }

    getLocalDownPath(key) {
        const pathFS = this.publicBucket ? Promise.resolve([this.publicBucket]) : this.getbucketName()
        return pathFS.then(data => {
            if(Array.isArray(data) && data.length > 0){
                const patten = /^https?/
                this.publicBucket =  patten.test(data[0]) ? data[0] : `http://${data[0]}`
                return this.bucketManager.publicDownloadUrl(this.publicBucket, key)
            }else{
                throw Error('域名未找到， 查看存储空间是否过期')
            }
        })
    }

    getbucketName() {
        const requURL = `http://uc.qbox.me/v2/domains?tbl=${this.bucket}`
        const digToken = qiniu.util.generateAccessToken(this.mac, requURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(requURL, digToken, this.__handleCallback( resolve, reject ))
        })
    }

    downloadFile(key, downloadPath) {
        return this.getLocalDownPath(key).then(link => {
            const timeStamp =  new Date().getTime()
            const url = `${link}?timestamp=${timeStamp}`
            return axios({
                url,
                method:'GET',
                responseType:'stream',
                headers:{'Cache-Control': 'no-cache'}

            })
        }).then(res => {
            const writerURL = fs.createWriteStream(downloadPath)
            res.data.pipe(writerURL)
            return new Promise(( resolve, reject ) => {
                writerURL.on('finish', resolve)
                writerURL.on('error', reject)
            })
        }).catch( err => {
            return Promise.reject({ err: err.response })
        })
    }

    __handleCallback( resolve, reject ) {
        return (err, respBody, respInfo) => {
            if (err) {
                throw err;
            }
            if (respInfo.statusCode === 200) {
                  resolve(respBody);
            } else {
                reject({
                    statusCode : respInfo.statusCode,
                    body : respBody
                })
            }
        };
    }
}

module.exports = QiniuManager