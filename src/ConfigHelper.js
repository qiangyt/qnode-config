/* eslint no-sync: "off" */
/* eslint no-process-env: "off" */
/* eslint global-require: "off" */

const Fs = require('fs');
const _ = require('lodash');
const Path = require('path');
const Yaml = require('js-yaml');

const env = process.env;

const YAML_LOAD_OPTIONS = {};
const YAML_DUMP_OPTIONS = {};
const FILE_READ_OPTIONS = { encoding: 'utf-8' || env[global.PROJECT_PREFIX + '_CHARSET'] || env.CHARSET };


let _logger;

function logger() {
    if (!_logger) {
        const Logger = require('qnode-log');
        _logger = new Logger('qnode-config');
    }
    return _logger;
}

function logError() {
    logger().error(...arguments);
}

function logInfo() {
    logger().info(...arguments);
}

function loadSpecificWithProfile(base, ext, profile) {
    const fullPath = base + (profile ? ('.' + profile) : ext);

    let content;
    try {
        content = Fs.readFileSync(fullPath, FILE_READ_OPTIONS);
    } catch (e) {
        return undefined;
    }

    const isJavascript = ('.js' === ext);
    if (isJavascript) {
        try {
            return eval(content);
        } catch (e) {
            logError('error occurred during evaluate js file: ' + fullPath);
            throw e;
        }
    }

    try {
        return Yaml.load(content, YAML_LOAD_OPTIONS);
    } catch (e) {
        logError('error occurred during parse YAML/JSON file: ' + fullPath);
        throw e;
    }
}

function loadSpecific(base, ext, profile, dump) {
    let r = loadSpecificWithProfile(base, ext);
    let profiled = loadSpecificWithProfile(base, ext, profile);

    if (!r && !profiled) return undefined;

    _.merge(r || {}, profiled || {});

    if (dump) {
        const yamlText = Yaml.dump(r, YAML_DUMP_OPTIONS);
        logInfo(yamlText);
    }

    return r;
}

function normalize(file) {
    let r;

    if ('string' === typeof file) {
        const p = Path.parse(file);
        r = { dir: p.dir, name: p.name, ext: p.ext };
    } else {
        r = _.cloneDeep(file);
    }

    const ext = r.ext;
    if (ext) r.ext = (ext.indexOf('.') === 0) ? ext : `.${ext}`;

    const n = r.name;
    if (!n) throw new Error('file name is required');
    if (!n.indexOf('.')) throw new Error(`file name "${n}" should NOT contain extension`);

    if (!r.dir) r.dir = process.cwd();

    r.base = Path.normalize(Path.join(r.dir, n));

    r.profile = r.profile || env[global.PROJECT_PREFIX + '_PROFILE'] || env.NODE_ENV;

    return r;
}

/**
 * Read a configuration file. 
 * 
 * Support format: yaml, json, js.
 * Support extension: .yml, .yaml, .json, .js
 * 
 * @param {*} file 1) if it is a string, I will think it a full path
 *                 2) if it is a object, I will think it is structured as:
 *                    {
 *                        dir: '',  // directory name. optional, working dir by default
 *                        name: '', // file name, without ext. must.
 *                        ext: '', // force to be with this extension. optional.
 *                    }
 * @param defaultConfig default config if file not exists. optional
 * @param boolean dump true to dump the content
 */
function load(file, defaultConfig, dump) {
    const f = normalize(file);
    const b = f.base;
    const p = f.profile;
    const ext = f.ext;

    if (ext) {
        const p = b + ext;
        let r = loadSpecific(b, '.js', p, defaultConfig, dump);
        if (r) return r;

        if (defaultConfig) return defaultConfig;

        throw new Error('file not found: ' + p);
    }

    let r = loadSpecific(b, '.yml', p, defaultConfig, dump);
    if (r) return r;

    r = loadSpecific(b, '.yaml', p, defaultConfig, dump);
    if (r) return r;

    r = loadSpecific(b, '.json', p, defaultConfig, dump);
    if (r) return r;

    r = loadSpecific(b, '.js', p, defaultConfig, dump);
    if (r) return r;

    if (defaultConfig) return defaultConfig;

    throw new Error(`file not found: ${b}[.profile].yml( or .yaml/.json/.js)`);

}

module.exports = {
    loadSpecific,
    load,
    normalize,
    logInfo,
    logError,

    YAML_LOAD_OPTIONS,
    YAML_DUMP_OPTIONS,
    FILE_READ_OPTIONS
};