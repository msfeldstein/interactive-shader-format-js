var test = require('tape')
var fs = require('fs')
var ISFUpgrader = require('../lib/ISFUpgrader')

function assetLoad(name) {
	return fs.readFileSync('./tests/assets/' + name).toString()
}

test('Upgrade to v2', (t) => {
	var old = assetLoad('version1.fs')
	var upgraded = ISFUpgrader(old)
	t.equal(upgraded, assetLoad('version1.upgraded.fs'), "upgraded correctly")
	t.end()
})
