var fs = require('fs');
var crypto = require('crypto');
var untildify = require('untildify');

var algorithm = 'aes-256-cbc';

module.exports = function (key, environments) {
  var that = {};

  if (environments === undefined) environments = JSON.parse(fs.readFileSync('.encrypt-env.json'));
  var env = environments[key];

  var encrypt = function (key, text) {
    key = key.toString().trim();

    var iv = crypto.randomBytes(16);
    var algorithm = 'aes-256-cbc';

    var cipher = crypto.createCipheriv(algorithm, key, iv);

    var encryptedText = cipher.update(text);
    var finalBuffer = Buffer.concat([encryptedText, cipher.final()]);

    return iv.toString('hex') + ':' + finalBuffer.toString('hex');
  };

  var decrypt = function (key, text) {
    key = key.toString().trim();

    var encryptedArray = text.toString().split(':');

    var iv = new Buffer(encryptedArray[0], 'hex');
    var encryptedText = new Buffer(encryptedArray[1], 'hex');

    var decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decryptedText = decipher.update(encryptedText, 'hex', 'utf8');

    decryptedText += decipher.final('utf8');

    return decryptedText;
  };

  that.decryptEnv = function (write) {
    if (write !== true) write = false;

    var encryptedEnv = fs.readFileSync(untildify(env.envFile + '.enc'));
    var aesKey = fs.readFileSync(untildify(env.aesKey));

    var decryptedEnv = decrypt(aesKey, encryptedEnv);

    if (write) {
      fs.openSync(env.envFile, 'w+');
      fs.writeFileSync(env.envFile, decryptedEnv);
    }

    return decryptedEnv;
  };

  that.encryptEnv = function () {
    var decryptedEnv = fs.readFileSync(env.envFile);
    var aesKey = fs.readFileSync(untildify(env.aesKey));

    var encryptedEnv = encrypt(aesKey, decryptedEnv);

    fs.openSync(untildify(env.envFile + '.enc'), 'w+');
    fs.writeFileSync(untildify(env.envFile + '.enc'), encryptedEnv);
    return encryptedEnv;
  };

  return that;
};
