const SRC = '../src';
const ConfigHelper = require(`${SRC}/ConfigHelper`);

describe('TODO', function() {

    it('is(): truthy', function() {
        expect(ConfigHelper.is('test.json', 'test')).toBeTruthy();
        expect(ConfigHelper.is('test.js', 'test')).toBeTruthy();
        expect(ConfigHelper.is('test.yaml', 'test')).toBeTruthy();
        expect(ConfigHelper.is('test.yml', 'test')).toBeTruthy();

        expect(ConfigHelper.is('test2.yml', 'test')).toBeFalsy();
    });

    it('is(): case sensitive', function() {
        expect(ConfigHelper.is('test.JSON', 'test')).toBeFalsy();
        expect(ConfigHelper.is('test.JS', 'test')).toBeFalsy();
        expect(ConfigHelper.is('test.YAML', 'test')).toBeFalsy();
        expect(ConfigHelper.is('test.YML', 'test')).toBeFalsy();

        expect(ConfigHelper.is('test.yml', 'TEST')).toBeFalsy();
    });

});